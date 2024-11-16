// api/recommend.js
import OpenAI from "openai";

export default async function handler(req, res) {
  // Set CORS headers to allow requests from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS method
  if (req.method === 'OPTIONS') {
    return res.status(200).end(); // Respond OK to OPTIONS requests
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize OpenAI with API key from environment variable
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY, // Make sure to set this in your Vercel environment variables
    });

    // Get the user's response from the request body
    const { response } = req.body;

    // Validate input
    if (!response) {
      return res.status(400).json({ error: 'Response is required' });
    }

    // Create prompt to generate three conversation options based on the user's response
    const prompt = `Given this message which includes both the conversation and context: "${response}"

What are three natural ways to respond to this message? Each version should:
- Include both Thai and English versions
- From the perspective of the user responding to this message
- Be natural and contextually appropriate
- Include common Thai phrases where natural, and focus on conversational and casual language, not academic.
- Be limited to one sentence per language

Return only raw JSON in this exact format without any markdown or code block syntax:
{
  "recommendations": [
    {
      "Thai": "Thai message here",
      "English": "English message here"
    },
    {
      "Thai": "Second Thai message here",
      "English": "Second English message here"
    },
    {
      "Thai": "Third Thai message here",
      "English": "Third English message here"
    }
  ]
}`;

    // Get the recommendations from OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "user", content: prompt }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    // Extract the generated response text
    const responseText = completion.choices[0].message.content.trim();

    // Parse the JSON response from OpenAI
    let recommendations;
    try {
      recommendations = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error("Failed to parse OpenAI response as JSON. Response: " + responseText);
    }

    // Return the recommendations
    return res.status(200).json({
      success: true,
      recommendations: recommendations,
    });

  } catch (error) {
    console.error('Recommend endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate recommendations',
      details: error.message
    });
  }
}