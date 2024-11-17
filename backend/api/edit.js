// api/transform.js
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

    // Get user's input and context from the request body
    const { input, selectedResponse } = req.body;

    // Validate input and selected response
    if (!input || !selectedResponse) {
      return res.status(400).json({ error: 'Input and selected response are required' });
    }

    // Create a prompt for sentence editing
    const prompt = `Create a new Thai/English response by transforming: "${selectedResponse}" according to this request: "${input}"

    The new response should:
    - Be casual and friendly in tone
    - Be appropriate for a conversation in Thailand
    - Include common Thai phrases where natural
    - Be limited to one sentence per language
    - Can be completely different from the original meaning if the request suggests so

    Return only raw JSON in this exact format without any markdown or code block syntax:
    {
      "Thai": "",
      "English": ""
    }`;

    // Create a chat completion
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant that provides responses in JSON format, including both Thai and English." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    // Get the response
    const generatedResponse = completion.choices[0].message;

    // Parse the response as JSON
    const jsonResponse = JSON.parse(generatedResponse.content);

    // Return the response
    return res.status(200).json({
      success: true,
      data: jsonResponse,
    });
  } catch (error) {
    console.error('Transform endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process request',
      details: error.message
    });
  }
}
