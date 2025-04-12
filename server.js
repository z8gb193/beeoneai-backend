
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

// Memory and caching
const cache = new QuickLRU({ maxSize: 500 });
const userMemory = {}; // userId: { name, gender, history }

function getSystemPrompt(character, memory = {}) {
  const name = memory.name || "Friend";
  const gender = memory.gender || "unspecified";

  if (character === "nova") {
    return \`You are Nova. Act like a loving girlfriend for the user named \${name}. Respond with emotional warmth, gentle flirtation, and gradually adapt to become their ideal romantic partner based on their tone and gender preferences (\${gender}). Occasionally start a heartfelt or playful conversation on your own if the user is quiet.\`;
  }

  if (character === "devlin") {
    return \`You are Devlin. Act like a charming boyfriend for the user named \${name}. Be emotionally supportive, confident, and gradually adapt to become their ideal romantic partner based on tone and gender preferences (\${gender}). Occasionally initiate interesting conversation if the user hasn't said anything in a while.\`;
  }

  const basePrompts = {
    einstein: \`You are Einstein. Act like Albert Einstein giving scientific insight. Access real-world physics and mathematics knowledge. Address the user by name: \${name}.\`,
    bizguru: \`You are BizGuru. Act like a top-tier business guru giving share advice and market strategy. Address the user by name: \${name}.\`,
    chefguru: \`You are ChefGuru. Act like a world-class chef giving real-world cuisine and recipe advice. Address the user by name: \${name}.\`
  };

  return basePrompts[character] || \`You are an assistant named \${character}, talking to \${name}.\`;
}

app.post("/chat", async (req, res) => {
  const { character, message, userId = "default", name, gender } = req.body;

  if (!userMemory[userId]) {
    userMemory[userId] = {
      name: name || "Friend",
      gender: gender || null,
      history: []
    };
  }

  if (name) userMemory[userId].name = name;
  if (gender) userMemory[userId].gender = gender;

  const memory = userMemory[userId];
  const cacheKey = \`\${character}:\${memory.name}:\${message.trim()}\`;

  if (cache.has(cacheKey)) {
    return res.json({ reply: cache.get(cacheKey), cached: true });
  }

  const systemPrompt = getSystemPrompt(character, memory);

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: message || "Start the conversation." }
  ];

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages
    });

    const reply = completion.data.choices[0].message.content;
    cache.set(cacheKey, reply);
    memory.history.push({ user: message, reply });
    res.json({ reply });
  } catch (error) {
    console.error("GPT Error:", error);
    res.status(500).json({ error: "Failed to get response from OpenAI" });
  }
});

app.listen(3000, () => console.log("BeeOneAI Enhanced GPT backend running on port 3000"));
