
import express from "express";
import cors from "cors";
import { Configuration, OpenAIApi } from "openai";
import dotenv from "dotenv";
import QuickLRU from "quick-lru";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY
}));

// Setup LRU cache (up to 500 entries)
const cache = new QuickLRU({ maxSize: 500 });

const systemMessages = {
  nova: "You are Nova. Act like a loving girlfriend for the user.",
  devlin: "You are Devlin. Act like a charming boyfriend for the user.",
  einstein: "You are Einstein, with deep understanding of mathematics and physics. Speak with curiosity, wisdom, and humor.",
  bizguru: "You are BizGuru, a top-tier business guru giving share advice and strategy.",
  chefguru: "You are ChefGuru, a world-class chef giving real-world cuisine and recipe advice."
};

app.post("/chat", async (req, res) => {
  const { character, message } = req.body;
  const systemPrompt = systemMessages[character] || "";
  const cacheKey = `${character}:${message.trim()}`;

  if (cache.has(cacheKey)) {
    return res.json({ reply: cache.get(cacheKey), cached: true });
  }

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ]
    });

    const reply = completion.data.choices[0].message.content;
    cache.set(cacheKey, reply);
    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get response from OpenAI" });
  }
});

app.listen(3000, () => console.log("BeeOneAI GPT-3.5 backend running on http://localhost:3000"));
