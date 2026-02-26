import axios from "axios";

class LLMService {
  constructor() {
    this.provider = "openrouter";
  }

  async getHint(prompt, assignmentData) {
    try {
      console.log("🤖 Generating AI hint using OpenRouter...");

      return await this.callOpenRouter(assignmentData);

    } catch (error) {
      console.error(
        "❌ OpenRouter Error:",
        error.response?.data || error.message
      );

      console.log("⚠️ Falling back to mock...");
      return this.callMock();
    }
  }

  async callOpenRouter(assignmentData) {
    // ✅ Read env variables HERE (not in constructor)
    const apiKey = process.env.OPENROUTER_API_KEY;
    const apiUrl = process.env.OPENROUTER_API_URL;
    const model = process.env.OPENROUTER_MODEL || "openai/gpt-3.5-turbo";

    if (!apiKey) throw new Error("OpenRouter API key not configured");
    if (!apiUrl) throw new Error("OpenRouter API URL not configured");

    const response = await axios.post(
      apiUrl,
      {
        model,
        messages: [
          {
            role: "system",
            content: `
You are an expert SQL tutor.
Give ONLY a short hint (2-3 sentences).
DO NOT provide the full SQL query.
Guide conceptually.
`
          },
          {
            role: "user",
            content: `
Assignment: ${assignmentData.title}

Question:
${assignmentData.question_text || assignmentData.questionText}

Student Query:
${assignmentData.query || "Not attempted yet"}

Provide a helpful hint:
`
          }
        ],
        temperature: 0.3,
        max_tokens: 120
      },
      {
        timeout: 12000,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5000",
          "X-Title": "CipherSQLStudio"
        }
      }
    );

    const content = response?.data?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Invalid OpenRouter response format");
    }

    return {
      success: true,
      hint: content.trim(),
      provider: "openrouter",
      timestamp: new Date()
    };
  }

  callMock() {
    const hints = [
      "Use a WHERE clause to filter records properly.",
      "Make sure you select only required columns.",
      "If aggregation is needed, remember GROUP BY.",
      "Consider whether a JOIN is required."
    ];

    return {
      success: true,
      hint: hints[Math.floor(Math.random() * hints.length)],
      provider: "mock",
      isMock: true,
      timestamp: new Date()
    };
  }
}

export default new LLMService();