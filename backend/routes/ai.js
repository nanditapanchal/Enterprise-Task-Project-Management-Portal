import express from 'express';
import auth from '../middleware/auth.js';
import { Configuration, OpenAIApi } from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

router.post('/', auth, async (req, res) => {
  try {
    const { message, context } = req.body;

    const response = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a project management assistant helping users track tasks and projects.' },
        { role: 'user', content: message },
        // Optionally provide context: previous tasks/projects
        { role: 'assistant', content: context || '' },
      ],
      temperature: 0.7,
      max_tokens: 250,
    });

    const aiMessage = response.data.choices[0].message.content;
    res.json({ message: aiMessage });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ message: 'AI error' });
  }
});

export default router;
