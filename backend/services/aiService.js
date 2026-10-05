const RISK_LEVELS = ["Low Risk", "Moderate Risk", "High Risk"];

function parseBloodPressure(value) {
  if (value == null || value === "") return 0;
  const str = String(value);
  const match = str.match(/(\d+)/);
  return match ? Number(match[1]) : Number(value) || 0;
}

function normalizeRisk(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  if (lower.includes("high")) return "High Risk";
  if (lower.includes("moderate") || lower.includes("medium")) return "Moderate Risk";
  if (lower.includes("low")) return "Low Risk";
  for (const level of RISK_LEVELS) {
    if (lower.includes(level.toLowerCase())) return level;
  }
  return null;
}

function ruleBasedPrediction({ glucose, bloodPressure, bmi }) {
  const bp = parseBloodPressure(bloodPressure);
  const g = Number(glucose) || 0;
  const b = Number(bmi) || 0;

  if (g > 200 || bp > 160 || b > 35) return "High Risk";
  if (g > 140 || bp > 140 || b > 30) return "Moderate Risk";
  return "Low Risk";
}

function buildPrompt({ name, age, gender, glucose, bloodPressure, bmi }) {
  return `Assess clinical risk for this patient:
- Name: ${name}
- Age: ${age}
- Gender: ${gender}
- Glucose: ${glucose} mg/dL
- Blood Pressure: ${bloodPressure}
- BMI: ${bmi} kg/m²

Reply with exactly one of these labels and nothing else: Low Risk, Moderate Risk, High Risk`;
}

const SYSTEM_PROMPT =
  "You are a clinical risk triage assistant. Classify patient risk using vitals. Respond with only one label: Low Risk, Moderate Risk, or High Risk.";

async function chatCompletion({ url, apiKey, model, messages }) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.1,
      max_tokens: 20,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`AI API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  const prediction = normalizeRisk(content);

  if (!prediction) {
    throw new Error(`Unexpected AI response: ${content}`);
  }

  return prediction;
}

async function predictWithGemini(patientData) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `${SYSTEM_PROMPT}\n\n${buildPrompt(patientData)}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 20,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  const prediction = normalizeRisk(content);

  if (!prediction) {
    throw new Error(`Unexpected Gemini response: ${content}`);
  }

  return prediction;
}

async function predictWithGroq(patientData) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  return chatCompletion({
    url: "https://api.groq.com/openai/v1/chat/completions",
    apiKey,
    model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildPrompt(patientData) },
    ],
  });
}

async function predictWithOpenRouter(patientData) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  return chatCompletion({
    url: "https://openrouter.ai/api/v1/chat/completions",
    apiKey,
    model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildPrompt(patientData) },
    ],
  });
}

function getActiveProvider() {
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.OPENROUTER_API_KEY) return "openrouter";
  return "rules";
}

function getSetupInstructions() {
  return {
    gemini: {
      name: "Google Gemini",
      url: "https://aistudio.google.com/apikey",
      envKey: "GEMINI_API_KEY",
      note: "Free — sign in with Google, click Create API key. No credit card.",
    },
    groq: {
      name: "Groq",
      url: "https://console.groq.com/keys",
      envKey: "GROQ_API_KEY",
      note: "Free — email signup, create API key. No credit card.",
    },
    openrouter: {
      name: "OpenRouter",
      url: "https://openrouter.ai/keys",
      envKey: "OPENROUTER_API_KEY",
      note: "Free models available — sign up and create a key. No credit card.",
    },
  };
}

async function predictRisk(patientData) {
  const providers = [
    { name: "gemini", fn: predictWithGemini },
    { name: "groq", fn: predictWithGroq },
    { name: "openrouter", fn: predictWithOpenRouter },
  ];

  for (const provider of providers) {
    try {
      const prediction = await provider.fn(patientData);
      if (prediction) {
        return { prediction, source: provider.name };
      }
    } catch (error) {
      console.warn(`[AI] ${provider.name} failed:`, error.message);
    }
  }

  return {
    prediction: ruleBasedPrediction(patientData),
    source: "rules",
  };
}

module.exports = {
  predictRisk,
  getActiveProvider,
  getSetupInstructions,
  parseBloodPressure,
  ruleBasedPrediction,
};
