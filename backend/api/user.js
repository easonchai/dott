import prisma from '../lib/prisma';

const AGENT_ID = "6720c2cf75c29d68a6527a2c";

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST /api/user - Create or update user
  if (req.method === 'POST') {
    try {
      const { tgId, name } = req.body;

      if (!tgId || !name) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const user = await prisma.user.upsert({
        where: { tgId },
        update: { name },
        create: { tgId, name }
      });

      // create the privvy persona
      const privvyKey = process.env.PRIVVY_KEY;
      const personaCreate = await fetch(`https://api.privvy.xyz/persona`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${privvyKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ agentId: AGENT_ID, name: user.name, referenceId: user.tgId })
      });
      console.log('Privvy API Status:', personaCreate);
      const personaResponse = await personaCreate.json();
      if (personaCreate.ok) {
        const persona = personaResponse.persona;
        user.privvyId = persona._id;
        await prisma.user.update({
          where: { tgId },
          data: { privvyId: persona._id }
        });
      }

      return res.status(200).json({ success: true, user });
    } catch (error) {
      console.error('User creation error:', error);
      return res.status(500).json({ error: 'Failed to create/update user' });
    }
  }

  // GET /api/user?tgId={tgId} - Get user profile
  if (req.method === 'GET') {
    try {
      const { tgId } = req.query;

      const user = await prisma.user.findUnique({
        where: { tgId },
        include: {
          conversations: {
            orderBy: { updatedAt: 'desc' },
            take: 5
          }
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json({ success: true, user });
    } catch (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ error: 'Failed to fetch user' });
    }
  }

  // PATCH /api/user?tgId={tgId} - Update user context/preferences
  if (req.method === 'PATCH') {
    try {
      const { tgId } = req.query;
      const { context } = req.body;

      const user = await prisma.user.update({
        where: { tgId },
        data: { context }
      });

      return res.status(200).json({ success: true, user });
    } catch (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ error: 'Failed to update user' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 