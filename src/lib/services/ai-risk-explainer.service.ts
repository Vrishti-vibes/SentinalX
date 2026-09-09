/**
 * SentinalX AI Risk Explainer Service
 * Single AI Provider Abstraction for Risk Explanations/Summaries.
 * Note: Numerical risk score comes strictly from the deterministic Risk Engine, NOT from the LLM.
 */

export interface AiRiskExplanation {
  available: boolean;
  provider: string;
  explanation: string;
  actionSummary: string;
  source: string;
}

export async function generateAiRiskExplanation(params: {
  locationName: string;
  numericalScore: number;
  riskLevel: string;
  rainfall24h: number;
  soilMoisture: number;
  porePressure: number;
  primaryThreat: string;
}): Promise<AiRiskExplanation> {
  // Check for configured single AI provider (Gemini or OpenAI)
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!geminiKey && !openaiKey) {
    return {
      available: false,
      provider: "Not Configured",
      explanation: "AI explanation unavailable / provider not configured.",
      actionSummary: "Adhere to the deterministic risk model and designated safe routes.",
      source: "Provider Credentials Missing in Environment",
    };
  }

  // If Gemini API Key is configured
  if (geminiKey) {
    try {
      const prompt = `You are the SentinalX Geotechnical Risk Explainer.
Given these deterministic sensor and weather metrics:
- Location: ${params.locationName}
- Landslide Risk Score: ${params.numericalScore}/100 (${params.riskLevel})
- 24h Rainfall: ${params.rainfall24h} mm
- Soil Saturation: ${params.soilMoisture}%
- Pore Water Pressure: ${params.porePressure} kPa
- Threat: ${params.primaryThreat}

Provide a concise, 2-sentence geotechnical explanation for disaster responders and citizens. Do NOT change the risk score.`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return {
            available: true,
            provider: "Google Gemini 1.5",
            explanation: text.trim(),
            actionSummary: "AI summary generated from deterministic geotechnical parameters.",
            source: "Live Gemini API",
          };
        }
      }
    } catch (err) {
      console.warn("[AiRiskExplainer] Provider call failed:", err);
    }
  }

  return {
    available: false,
    provider: geminiKey ? "Google Gemini" : "OpenAI",
    explanation: "AI explanation unavailable / provider not configured.",
    actionSummary: "Consult standard SOP and sensor monitors.",
    source: "Provider Connection Inactive",
  };
}
