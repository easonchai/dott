import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { createClient } from '@supabase/supabase-js';

const VOICE_CONFIGS = {
  'th-TH': {
    neural: {
      female: [
        'th-TH-PremwadeeNeural',  // Professional tone
        'th-TH-AchararatNeural'   // Warm tone
      ],
      male: [
        'th-TH-NiwatNeural',      // Clear tone
        'th-TH-PrabhaatNeural'    // Friendly tone
      ]
    }
  },
  'en-US': {
    neural: {
      female: ['en-US-JennyMultilingualNeural'],
      male: ['en-US-GuyMultilingualNeural']
    }
  }
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function getVoice(language, { gender = 'female' } = {}) {
  const voices = VOICE_CONFIGS[language] || VOICE_CONFIGS['th-TH'];
  const voiceList = gender === 'male' ? voices.neural.male : voices.neural.female;
  return voiceList[0];
}

// Fix hash function
const getTextHash = (text, language, voice) => {
  // Remove language prefix from voice name
  const voiceName = voice.toLowerCase().replace(`${language.toLowerCase()}-`, '');
  
  // Create a hash of the text instead of using the text directly
  const hash = Buffer.from(text).toString('base64')
    .replace(/[+/=]/g, '') // remove invalid filename chars
    .slice(0, 32); // keep it reasonably short

  return `${language.toLowerCase()}-${voiceName}-${hash}`;
};

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      text, 
      language = 'th-TH',
      voiceOptions = {
        gender: 'female'
      },
      speechOptions = {
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0
      }
    } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const speechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.AZURE_SUBSCRIPTION_KEY,
      process.env.AZURE_REGION
    );

    const selectedVoice = getVoice(language, voiceOptions);
    speechConfig.speechSynthesisVoiceName = selectedVoice;
    speechConfig.speechSynthesisOutputFormat = 
      sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

    const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

    const result = await new Promise((resolve, reject) => {
      synthesizer.speakTextAsync(
        text,
        result => {
          synthesizer.close();
          resolve(result);
        },
        error => {
          synthesizer.close();
          reject(error);
        }
      );
    });

    if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
      try {
        const audioBuffer = Buffer.from(result.audioData);
        const hash = getTextHash(text, language, selectedVoice);
        const fileName = `${hash}.mp3`;

        // Upload new file
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('audio')
          .upload(fileName, audioBuffer, {
            contentType: 'audio/mp3',
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error('Supabase upload error:', uploadError);
          throw uploadError;
        }

        // Verify file exists after upload
        const { data: fileData, error: fileError } = await supabase
          .storage
          .from('audio')
          .download(fileName);

        if (fileError || !fileData) {
          throw new Error('Failed to verify uploaded file');
        }

        // Get public URL only after verification
        const { data: urlData, error: urlError } = await supabase
          .storage
          .from('audio')
          .getPublicUrl(fileName);

        if (urlError) {
          throw urlError;
        }

        // Return both URL and file size for verification
        return res.json({ 
          url: urlData.publicUrl,
          size: audioBuffer.length,
          fileName: fileName,
          verified: true
        });

      } catch (error) {
        console.error('Storage operation failed:', error);
        throw error;
      }
    } else {
      throw new Error(`Speech synthesis failed: ${result.errorDetails}`);
    }

  } catch (error) {
    console.error('TTS error:', error);
    return res.status(500).json({ 
      error: 'Failed to synthesize speech',
      details: error.message 
    });
  }
}
