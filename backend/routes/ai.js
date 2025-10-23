import express from 'express';
import auth from '../middleware/auth.js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// Initialize client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/ai  → Chat with AI assistant
router.post('/', auth, async (req, res) => {
  try {
    const { message, context } = req.body;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Faster and cheaper than gpt-4
      messages: [
        { role: 'system', content: 'You are a helpful AI project management assistant that helps users with task tracking, productivity, and planning.' },
        ...(context ? [{ role: 'assistant', content: context }] : []),
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 250,
    });

    const aiMessage = completion.choices[0].message.content;
    res.json({ message: aiMessage });
  } catch (err) {
    console.error('AI error:', err);
    res.status(500).json({ message: 'AI service error' });
  }
});

export default router;
