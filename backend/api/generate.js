// api/generate.js
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
    // Get the user's input from request body
    const { input } = req.body;

    // Validate input
    if (!input) {
      return res.status(400).json({ error: 'Input is required' });
    }

    // Initialize OpenAI with API key from environment variable
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY, // Make sure to set this in your Vercel environment variables
    });

    // Create chat completion
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: input }
      ],
    });

    // Get the response
    const generatedResponse = completion.choices[0].message;

    // Return the response
    return res.status(200).json({
      success: true,
      data: generatedResponse
    });

  } catch (error) {
    console.error('Generate endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate response',
      details: error.message
    });
  }
}
