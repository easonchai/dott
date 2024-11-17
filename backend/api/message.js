import prisma from '../lib/prisma';

const AGENT_ID = "6720c2cf75c29d68a6527a2c";

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST /api/message - Create message
  if (req.method === 'POST') {
    try {
      const { tgId, conversationId, nativeContent, targetLanguage } = req.body;

      if (!tgId || !conversationId || !nativeContent || !targetLanguage) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const user = await prisma.user.findUnique({
        where: { tgId },
        include: {
          conversations: {
            where: { id: conversationId }
          }
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const targetContent = `Translated: ${nativeContent}`; // Replace with actual translation

      const message = await prisma.message.create({
        data: {
          userId: user.id,
          conversationId,
          nativeContent,
          targetContent,
        }
      });

      // integrate with Privvy
      const privvyKey = process.env.PRIVVY_KEY;

      // check if user already has a personaId in privvy
      const personaId = user.privvyId;
      if (!personaId) {
        const personaFetch = await fetch(`https://api.privvy.xyz/persona/${personaId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${privvyKey}`,
          },
        });
        if (personaFetch.status === 404) {
          const personaCreate = await fetch(`https://api.privvy.xyz/persona`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${privvyKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ agentId: AGENT_ID, name: user.name })
          });
          if (personaCreate.status === 200) {
            const persona = await personaCreate.json();
            personaId = persona._id;
            await prisma.user.update({
              where: { id: user.id },
              data: { privvyId: personaId }
            });
          }
        }
      }
      // check if user now has a persona id set
      if (!personaId) {
        return res.status(400).json({ error: 'User does not have a persona id' });
      }

      const memoryText = `Native: ${nativeContent}\nTarget: ${targetContent}`;

      const response = await fetch(`https://api.privvy.xyz/memory/create/text`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${privvyKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          agentId: AGENT_ID, 
          content: memoryText, 
          personaId 
        }),
      });

      console.log('Privvy Memory Creation Status:', response.status);
      const memoryBody = await response.json();
      console.log('Privvy Memory Response:', memoryBody);

      if (response.status >= 200 && response.status < 300 && memoryBody.memory) {
        console.log('Memory ID:', memoryBody.memory._id);
        
        // Update the message with memoryId
        const updatedMessage = await prisma.message.update({
          where: { id: message.id },
          data: { memoryId: memoryBody.memory._id }
        });
        
        console.log('Updated Message:', updatedMessage);
        
        // Return the updated message instead of the original
        return res.status(201).json({ success: true, message: updatedMessage });
      } else {
        console.error('Failed to create memory:', memoryBody);
        return res.status(201).json({ 
          success: true, 
          message, 
          privvyError: memoryBody 
        });
      }
    } catch (error) {
      console.error('Message processing error:', error);
      return res.status(500).json({ error: 'Failed to process message' });
    }
  }

  // GET /api/message?conversationId={id} - Get conversation messages
  if (req.method === 'GET') {
    try {
      const { conversationId } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              name: true,
              tgId: true
            }
          }
        }
      });

      const totalMessages = await prisma.message.count({
        where: { conversationId }
      });

      return res.status(200).json({
        success: true,
        messages,
        pagination: {
          total: totalMessages,
          pages: Math.ceil(totalMessages / limit),
          currentPage: page
        }
      });
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return res.status(500).json({ error: 'Failed to fetch conversation' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
