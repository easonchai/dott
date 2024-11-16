import OpenAI from "openai";
import prisma from '../lib/prisma';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { prompt, userId } = req.body;

    if (!prompt || !userId) {
      return res.status(400).json({ error: 'Prompt and userId are required' });
    }

    const systemPrompt = `You are a Thai language learning scenario generator specializing in culturally accurate and contextually relevant scenarios.

Your response must follow this exact JSON structure:
{
  "scenario": {
    "narrative": "Brief narrative describing the scenario context",
    "location": "Specific location in Thailand",
    "time_period": "Time of day or year",
    "cultural_context": "Relevant cultural/societal context",
    "difficulty_level": "beginner/intermediate/advanced",
    "background_description": "Detailed scene description"
  },
  "phrases": [
    {
      "thai": "Thai text",
      "english": "English translation",
      "romanization": "Pronunciation guide",
      "formality": "casual/polite/formal",
      "usage_context": "When/how to use this phrase",
      "cultural_notes": "Cultural insights"
    }
  ],
  "characters": [
    {
      "name": "Thai name",
      "age": "numeric age",
      "occupation": "job or role",
      "personality": "key traits",
      "speaking_style": "speech characteristics",
      "background_story": "brief relevant background",
      "type": "elder_male/young_male/young_female/etc",
      "avatar_description": "visual description for avatar"
    }
  ]
}

Requirements:
- Generate natural, conversational Thai that natives actually use
- Include exactly 5 phrases
- Include exactly 3 characters
- Focus on cultural accuracy
- Include colloquial language and slang where appropriate
- All fields must be present and properly formatted`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: systemPrompt 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0].message.content;

    let generatedContent;
    try {
      const cleanJson = responseText.replace(/```json\n|\n```/g, '');
      generatedContent = JSON.parse(cleanJson);
      
      // Validate response structure
      if (!generatedContent.scenario || 
          !Array.isArray(generatedContent.phrases) || 
          generatedContent.phrases.length !== 5 ||
          !Array.isArray(generatedContent.characters) || 
          generatedContent.characters.length !== 3) {
        throw new Error("Invalid response structure");
      }
    } catch (parseError) {
      console.error('Parse error:', parseError, 'Response:', responseText);
      throw new Error("Failed to parse OpenAI response");
    }

    // After successful generation and parsing, save to database
    const savedScenario = await prisma.scenario.create({
      data: {
        userId,
        content: generatedContent,
      }
    });

    return res.status(200).json({
      success: true,
      data: generatedContent,
      scenarioId: savedScenario.id
    });

  } catch (error) {
    console.error('Scenario generation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate scenario',
      details: error.message
    });
  }
} 