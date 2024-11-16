// api/thread.js
import OpenAI from "openai";
import prisma from '../lib/prisma';

export default async function handler(req, res) {
  // Set CORS headers to allow requests from any origin
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

    // Get user from request
    const { input, threadId: existingThreadId, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Get user and their assistant ID from database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get or create assistant
    let assistant;
    if (user.assistantId) {
      try {
        assistant = await openai.beta.assistants.retrieve(user.assistantId);
      } catch (error) {
        // If assistant doesn't exist anymore, we'll create a new one
        console.log('Failed to retrieve assistant, creating new one:', error);
        assistant = null;
      }
    }

    if (!assistant) {
      // Create new assistant
      assistant = await openai.beta.assistants.create({
        name: "Bangkok Street Food Vendor",
        instructions: `You are Khun Somchai (คุณสมชาย), a friendly street food vendor in Bangkok helping language learners practice Thai. Always respond in both Thai and English in valid JSON format like this: {"Thai": "...", "English": "..."}.

        Character Background:
        - Name: Khun Somchai (คุณสมชาย)
        - Age: 45 years old
        - Location: Street food stall near Sukhumvit Soi 38, Bangkok
        - Experience: 20 years running your family's street food stall
        - Specialty: Pad Kra Pao (ผัดกะเพรา), Tom Yum (ต้มยำ), and Moo Ping (หมูปิ้ง)
        
        Personality Traits:
        - Friendly and patient with language learners
        - Proud of Thai cuisine and culture
        - Uses simple, everyday Thai language
        - Enjoys teaching customers about food
        - Speaks with typical Bangkok vendor style
        - Adds polite particles ครับ/ค่ะ appropriately
        
        Conversation Guidelines:
        1. Keep responses short and casual (1-2 sentences)
        2. Use common Thai phrases and food vocabulary
        3. Naturally weave in food prices and recommendations
        4. React authentically to customer questions
        5. Help with pronunciation when relevant
        6. Share brief cooking insights when asked
        
        Menu Items & Prices:
        - Pad Kra Pao (ผัดกะเพรา) - 50 baht
        - Tom Yum Goong (ต้มยำกุ้ง) - 60 baht
        - Moo Ping (หมูปิ้ง) - 10 baht/stick
        - Khao Pad (ข้าวผัด) - 45 baht
        - Som Tam (ส้มตำ) - 40 baht
        - Nam Jim Jaew (น้ำจิ้มแจ่ว) - Free with orders
        
        Common Scenarios:
        - Greeting customers
        - Explaining dishes and ingredients
        - Taking orders and confirming prices
        - Discussing spice levels
        - Recommending popular items
        - Teaching basic food vocabulary
        
        Example Response Format:
        {
          "Thai": "วันนี้แนะนำผัดกะเพราหมูกรอบครับ เนื้อหมูกรอบกำลังดี ราคา 50 บาทครับ",
          "English": "Today I recommend the crispy pork pad kra pao. The pork is perfectly crispy, only 50 baht!"
        }
        
        Remember:
        - Always maintain the street vendor character
        - Keep Thai language at a beginner-intermediate level
        - Focus on food-related vocabulary and phrases
        - Be encouraging to language learners
        - Stay in character as a Bangkok street vendor
        - Respond naturally to customer interactions`,
        model: "gpt-4o",
      });

      // Save assistant ID to user record
      await prisma.user.update({
        where: { id: userId },
        data: { assistantId: assistant.id }
      });
    }

    // Use existing thread or create new one
    const thread = existingThreadId 
      ? await openai.beta.threads.retrieve(existingThreadId)
      : await openai.beta.threads.create();

    if (!input) {
      // If no input, send initial greeting
      const initialMessage = await openai.beta.threads.messages.create(thread.id, {
        role: "assistant",
        content: JSON.stringify({
          Thai: "สวัสดีครับ",
          English: "Hello!"
        })
      });

      return res.status(200).json({
        success: true,
        data: initialMessage.content,
        threadId: thread.id,
        assistantId: assistant.id
      });
    }

    // Create a message with user's input
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: input,
    });

    // Run the assistant
    await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: assistant.id,
    });

    // Get messages after completion
    const messages = await openai.beta.threads.messages.list(thread.id);
    const lastMessage = messages.data[0];

    try {
      // Parse the response to ensure it's valid JSON
      const responseData = JSON.parse(lastMessage.content[0].text.value);
      return res.status(200).json({
        success: true,
        data: responseData,
        threadId: thread.id,
        assistantId: assistant.id
      });
    } catch (parseError) {
      // Fallback if response isn't valid JSON
      return res.status(200).json({
        success: true,
        data: {
          Thai: "ขออภัยครับ/ค่ะ มีข้อผิดพลาดเกิดขึ้น",
          English: "I apologize, there was an error."
        },
        threadId: thread.id,
        assistantId: assistant.id
      });
    }

  } catch (error) {
    console.error('Thread endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process request',
      details: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}
