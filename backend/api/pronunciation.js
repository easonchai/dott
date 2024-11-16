import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

/**
 * Pronunciation Assessment API
 * 
 * This endpoint handles pronunciation assessment using Azure Speech Services.
 * It evaluates spoken audio against reference text and provides detailed scoring.
 * 
 * Scores provided:
 * - AccuracyScore: How accurately phonemes are pronounced
 * - FluencyScore: How smoothly words flow together
 * - CompletenessScore: Ratio of pronounced words to reference text
 * - ProsodyScore: Natural rhythm and intonation (en-US only)
 * - PronScore: Overall pronunciation quality
 * 
 * Error types detected:
 * - Mispronunciation
 * - Omission
 * - Insertion
 * - UnexpectedBreak
 * - MissingBreak
 * - Monotone
 */

const SUPPORTED_LANGUAGES = {
  'th-TH': 'Thai (Thailand)',
  'en-US': 'English (United States)',
  'es-ES': 'Spanish (Spain)', 
  'fr-FR': 'French (France)'
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const {
      referenceText,
      audioData,  // base64 string
      language = 'th-TH'
    } = req.body;

    // Validate inputs
    if (!referenceText || !audioData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!SUPPORTED_LANGUAGES[language]) {
      return res.status(400).json({ error: 'Unsupported language' });
    }

    // Decode base64 audio
    let audioBuffer;
    try {
      audioBuffer = Buffer.from(audioData, 'base64');
    } catch (error) {
      return res.status(400).json({ 
        error: 'Invalid audio data',
        details: 'Must be base64 encoded audio'
      });
    }

    // Initialize Speech SDK
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.AZURE_SUBSCRIPTION_KEY,
      process.env.AZURE_REGION
    );
    speechConfig.speechRecognitionLanguage = language;

    // Configure pronunciation assessment
    const pronunciationConfig = new sdk.PronunciationAssessmentConfig(
      referenceText,
      sdk.PronunciationAssessmentGradingSystem.HundredMark,
      sdk.PronunciationAssessmentGranularity.Phoneme,
      true
    );

    // Enable prosody for English only
    if (language === 'en-US') {
      pronunciationConfig.enableProsodyAssessment();
    }

    // Create audio stream from buffer
    const pushStream = sdk.AudioInputStream.createPushStream();
    pushStream.write(audioBuffer);
    pushStream.close();
    const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);

    // Create recognizer
    const recognizer = new sdk.SpeechRecognizer(
      speechConfig,
      audioConfig
    );

    // Apply pronunciation config
    pronunciationConfig.applyTo(recognizer);

    // Get assessment result
    const result = await new Promise((resolve, reject) => {
      recognizer.recognizeOnceAsync(
        result => {
          const pronunciationResult = 
            sdk.PronunciationAssessmentResult.fromResult(result);
          resolve(pronunciationResult);
        },
        error => reject(error)
      );
    });

    // Return assessment results
    return res.status(200).json({
      success: true,
      assessment: {
        accuracyScore: result.accuracyScore,
        fluencyScore: result.fluencyScore,
        completenessScore: result.completenessScore,
        prosodyScore: language === 'en-US' ? result.prosodyScore : null,
        pronScore: result.pronScore,
        detailedResults: result.detailedResults
      }
    });

  } catch (error) {
    console.error('Pronunciation assessment error:', error);
    return res.status(500).json({
      error: 'Failed to assess pronunciation',
      details: error.message
    });
  }
} 