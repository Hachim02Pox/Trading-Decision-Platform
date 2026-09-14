import { loadAppConfig } from "../../config/env";
import type { CloudLLMProvider } from "./contracts";

export function createGroqLlmProvider(
  model: "kpi" | "night",
): CloudLLMProvider | null {
  const config = loadAppConfig().providers.groq;
  if (!config) return null;
  const selected = model === "kpi" ? config.kpiModel : config.nightModel;
  return {
    id: "groq",
    model: selected,
    async completeJson(prompt, signal) {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          signal: signal ?? AbortSignal.timeout(45_000),
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: selected,
            temperature: 0.1,
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content:
                  "Return only valid JSON. Never invent sources or causal explanations.",
              },
              { role: "user", content: prompt },
            ],
          }),
        },
      );
      if (response.status === 429) throw new Error("PROVIDER_LIMIT");
      if (!response.ok)
        throw new Error(`Groq request failed (${response.status})`);
      const body = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = body.choices?.[0]?.message?.content;
      if (!text) throw new Error("Groq returned no content");
      return JSON.parse(text);
    },
  };
}
