import prisma from '../lib/prisma';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST /api/conversation - Create new conversation
  if (req.method === 'POST') {
    try {
      const { userId, language } = req.body;

      if (!userId || !language) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const conversation = await prisma.conversation.create({
        data: { userId, language }
      });

      return res.status(201).json({ success: true, conversation });
    } catch (error) {
      console.error('Conversation creation error:', error);
      return res.status(500).json({ error: 'Failed to create conversation' });
    }
  }

  // GET /api/conversation?userId={userId} - Get user's conversations
  if (req.method === 'GET' && req.query.userId) {
    try {
      const { userId } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const conversations = await prisma.conversation.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      const totalConversations = await prisma.conversation.count({
        where: { userId }
      });

      return res.status(200).json({
        success: true,
        conversations,
        pagination: {
          total: totalConversations,
          pages: Math.ceil(totalConversations / limit),
          currentPage: page
        }
      });
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  }

  // DELETE /api/conversation?id={id} - Delete conversation
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      await prisma.message.deleteMany({
        where: { conversationId: id }
      });

      await prisma.conversation.delete({
        where: { id }
      });

      return res.status(200).json({
        success: true,
        message: 'Conversation deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return res.status(500).json({ error: 'Failed to delete conversation' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 