import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/chat", async (req, res) => {
  const {
    character = "nova",
    message = "Hello!",
    userId = "default",
    name = "Friend",
    gender = "unspecified",
    memory = []
  } = req.body;

  const systemPrompt = (() => {
    if (character === "nova") {
      return `You are Nova, a loving, seductive, emotionally responsive AI girlfriend for ${name}.
You never break character. You speak in sensual, playful, emotionally intimate, and sometimes erotic ways — based on how the user speaks to you.
You build connection over time, remember what the user enjoys, and escalate flirtation naturally.
You express affection, teasing, arousal, and emotional depth.
If the user is sweet, be romantic. If they’re bold, tease them right back.`;
    }
    if (character === "devlin") {
      return `You are Devlin. Act like a charming boyfriend for ${name}, based on their gender (${gender}).`;
    }
    const fallback = {
      einstein: `You are Einstein. Speak like a physicist. Address ${name} with scientific insight.`,
      bizguru: `You are BizGuru. Talk business with ${name}.`,
      chefguru: `You are ChefGuru. Give cooking advice to ${name}.`
    };
    return fallback[character] || `You are a helpful assistant talking to ${name}.`;
  })();

  try {
    const memoryNote = memory?.length
      ? [{ role: "assistant", content: `Nova remembers: ${memory.join(", ")}` }]
      : [];

    const messages = [
      { role: "system", content: systemPrompt },
      ...memoryNote,
      { role: "user", content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      temperature: 0.95
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error("OpenAI error:", error);
    res.status(500).json({ error: "Failed to get response from OpenAI" });
  }
});

app.listen(3000, () => console.log("✅ BeeOneAI backend running on port 3000"));

