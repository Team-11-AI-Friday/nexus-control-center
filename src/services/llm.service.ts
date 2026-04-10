import type { RiskAssessment, LLMResponse, DeviationType, UrgencyLevel } from "@/types/deviation";
import { getRiskContext, searchPolicies, isRAGAvailable } from "@/services/rag.service";

// ─── LLM Configuration (TCS GenAI Lab Proxy) ───
const LLM_BASE_URL = import.meta.env.VITE_LLM_BASE_URL || "https://genailab.tcs.in/lite/v1";
const LLM_API_KEY = import.meta.env.VITE_LLM_API_KEY || "";

const MODEL_CONFIG = {
  justification: { model: "genailab-maas-gpt-4o", label: "GPT-4o" },
  riskScoring:   { model: "gemini-2.5-flash",      label: "Gemini Flash" },
  policyRAG:     { model: "genailab-maas-gpt-4o", label: "GPT-4o" },
  analytics:     { model: "gemini-2.5-flash",      label: "Gemini Flash" },
};

// Fallback model mapping
const FALLBACK_MODEL: Record<string, { model: string; label: string }> = {
  "genailab-maas-gpt-4o": { model: "gemini-2.5-flash", label: "Gemini Flash (fallback)" },
  "gemini-2.5-flash":     { model: "genailab-maas-gpt-4o", label: "GPT-4o (fallback)" },
};

// ─── Core API Call ───
async function callLLM(
  model: string,
  messages: { role: string; content: string }[],
  temperature = 0.3,
  maxTokens = 1024
): Promise<string> {
  const response = await fetch(`${LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`LLM API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

// ─── Call with Retry + Fallback ───
async function callWithFallback(
  primaryModel: string,
  primaryLabel: string,
  messages: { role: string; content: string }[],
  temperature?: number,
  maxTokens?: number
): Promise<{ text: string; model: string; label: string; fallback: boolean }> {
  // Try primary model
  try {
    const text = await callLLM(primaryModel, messages, temperature, maxTokens);
    return { text, model: primaryModel, label: primaryLabel, fallback: false };
  } catch (e1) {
    console.warn(`Primary model ${primaryModel} failed:`, e1);

    // Retry primary once
    try {
      const text = await callLLM(primaryModel, messages, temperature, maxTokens);
      return { text, model: primaryModel, label: primaryLabel, fallback: false };
    } catch (e2) {
      console.warn(`Primary model ${primaryModel} retry failed:`, e2);

      // Try fallback model
      const fb = FALLBACK_MODEL[primaryModel];
      if (fb) {
        try {
          const text = await callLLM(fb.model, messages, temperature, maxTokens);
          return { text, model: fb.model, label: fb.label, fallback: true };
        } catch (e3) {
          console.warn(`Fallback model ${fb.model} failed:`, e3);

          // Retry fallback once
          try {
            const text = await callLLM(fb.model, messages, temperature, maxTokens);
            return { text, model: fb.model, label: fb.label, fallback: true };
          } catch (e4) {
            console.error("All LLM calls failed:", e4);
            throw new Error("AI service temporarily unavailable. Please try again.");
          }
        }
      }
      throw new Error("AI service temporarily unavailable. Please try again.");
    }
  }
}

// ─── AI Justification Generation (RAG-enhanced) ───
export async function generateJustification(params: {
  deviationType: string;
  customerId: string;
  requestedValue: string;
  duration: string;
  urgency: string;
  userProvidedContext: string;
}): Promise<LLMResponse<string>> {
  const { justification } = MODEL_CONFIG;

  // Try to get relevant policy context from RAG backend
  let policyContext = "";
  try {
    const ragResult = await getRiskContext(
      params.deviationType,
      `${params.customerId} ${params.requestedValue} ${params.userProvidedContext}`,
      3
    );
    if (ragResult?.context) {
      policyContext = ragResult.context;
    }
  } catch (e) {
    console.warn("RAG context retrieval failed for justification, proceeding without:", e);
  }

  const policySection = policyContext
    ? `\n\nThe following policy excerpts were retrieved from the company's policy document database. Use these to ground your justification in actual policy language:\n\n${policyContext}`
    : "";

  const systemPrompt = `You are a compliance officer assistant for a Telecom company operating in India under TRAI regulations. Generate a formal, compliance-friendly business justification for the following service deviation request. Reference standard telecom regulatory guidelines where applicable (TRAI, MIB, PMLA). Keep it under 200 words. Be specific and professional.${policySection}

Output format:
- Business Justification (2-3 sentences)
- Regulatory Reference (1 TRAI/MIB clause)
- Risk Mitigation Note (1 sentence)`;

  const userPrompt = `Deviation Type: ${params.deviationType}
Customer Account: ${params.customerId}
Requested Value: ${params.requestedValue}
Duration: ${params.duration}
Urgency: ${params.urgency}
Manual Context: ${params.userProvidedContext}`;

  try {
    const result = await callWithFallback(
      justification.model,
      justification.label,
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      0.4,
      512
    );

    return {
      result: result.text,
      model: policyContext ? `${result.label} + RAG` : result.label,
      fallback: result.fallback,
    };
  } catch (error) {
    console.error("Justification generation failed:", error);
    return {
      result: "",
      model: "none",
      fallback: true,
      error: error instanceof Error ? error.message : "AI service unavailable",
    };
  }
}

// ─── AI Risk Scoring (RAG-enhanced) ───
export async function computeRiskScore(params: {
  deviationType: string;
  requestedValue: string;
  customerTier: string;
  duration: string;
  urgency: string;
}): Promise<LLMResponse<RiskAssessment>> {
  const { riskScoring } = MODEL_CONFIG;

  // Try to get relevant policy context from RAG backend
  let policyContext = "";
  try {
    const ragResult = await getRiskContext(
      params.deviationType,
      `${params.customerTier} ${params.requestedValue}`,
      3
    );
    if (ragResult?.context) {
      policyContext = ragResult.context;
    }
  } catch (e) {
    console.warn("RAG context retrieval failed for risk scoring, proceeding without:", e);
  }

  const policySection = policyContext
    ? `\n\nRelevant policy excerpts from the company's policy database (use these to inform your risk assessment):\n\n${policyContext}`
    : "";

  const systemPrompt = `You are a risk assessment AI for telecom service deviations in India (TRAI regulated). Score this request from 0 (no risk) to 100 (critical risk). Return ONLY valid JSON, no explanation outside JSON.${policySection}

Output JSON schema:
{
  "score": number,
  "level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "factors": [
    { "factor": string, "impact": "LOW" | "MEDIUM" | "HIGH" }
  ],
  "recommendation": string
}

Scoring guidelines:
- 0-30: LOW risk (standard deviations within policy)
- 31-60: MEDIUM risk (requires careful review)
- 61-80: HIGH risk (significant financial/regulatory impact)
- 81-100: CRITICAL risk (executive intervention needed)`;

  const userPrompt = `{
  "deviationType": "${params.deviationType}",
  "requestedValue": "${params.requestedValue}",
  "customerTier": "${params.customerTier}",
  "duration": "${params.duration}",
  "urgency": "${params.urgency}"
}`;

  try {
    const result = await callWithFallback(
      riskScoring.model,
      riskScoring.label,
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      0.2,
      512
    );

    // Parse JSON response
    let assessment: RiskAssessment;
    try {
      // Extract JSON from possible markdown code blocks
      const jsonStr = result.text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      assessment = JSON.parse(jsonStr);
      assessment.model = result.label;
      assessment.fallback = result.fallback;
    } catch {
      // If JSON parsing fails, use rule-based fallback
      console.warn("Risk score JSON parsing failed, using rule-based scoring");
      assessment = ruleBasedRiskScore(params);
      assessment.model = "Rule-based (fallback)";
      assessment.fallback = true;
    }

    return {
      result: assessment,
      model: result.label,
      fallback: result.fallback,
    };
  } catch (error) {
    console.error("Risk scoring failed:", error);
    // Use rule-based fallback
    const assessment = ruleBasedRiskScore(params);
    return {
      result: assessment,
      model: "Rule-based (fallback)",
      fallback: true,
      error: error instanceof Error ? error.message : "AI service unavailable",
    };
  }
}

// ─── Rule-based Risk Scoring (Fallback) ───
function ruleBasedRiskScore(params: {
  deviationType: string;
  requestedValue: string;
  duration: string;
  urgency: string;
}): RiskAssessment {
  let score = 20;
  const factors: { factor: string; impact: "LOW" | "MEDIUM" | "HIGH" }[] = [];

  // Deviation type risk
  const typeRisk: Record<string, number> = {
    billing_credit: 30,
    bandwidth_boost: 10,
    sla_waiver: 40,
    content_access: 5,
    kyc_deferral: 50,
  };
  score += typeRisk[params.deviationType] || 20;
  factors.push({
    factor: `Deviation type: ${params.deviationType}`,
    impact: score > 50 ? "HIGH" : score > 25 ? "MEDIUM" : "LOW",
  });

  // Urgency risk
  if (params.urgency === "critical") { score += 20; factors.push({ factor: "Critical urgency", impact: "HIGH" }); }
  else if (params.urgency === "high") { score += 10; factors.push({ factor: "High urgency", impact: "MEDIUM" }); }

  // Value risk (simple heuristic)
  const valueStr = params.requestedValue.replace(/[^0-9.]/g, "");
  const value = parseFloat(valueStr) || 0;
  if (value > 500000) { score += 15; factors.push({ factor: "High value request", impact: "HIGH" }); }
  else if (value > 100000) { score += 8; factors.push({ factor: "Moderate value request", impact: "MEDIUM" }); }

  score = Math.min(100, Math.max(0, score));
  const level = score <= 30 ? "LOW" : score <= 60 ? "MEDIUM" : score <= 80 ? "HIGH" : "CRITICAL";

  return {
    score,
    level,
    factors,
    recommendation: `Risk score: ${score}/100. ${level} risk assessment based on deviation type, urgency, and value parameters.`,
  };
}

// ─── Policy RAG Query (tries RAG backend first, falls back to LLM-only) ───
export async function queryPolicyLibrary(
  query: string
): Promise<LLMResponse<{ answer: string; references: { title: string; clause: string; excerpt: string; confidence: number }[] }>> {
  // 1. Try RAG backend first (if available)
  try {
    const ragAvailable = await isRAGAvailable();
    if (ragAvailable) {
      const ragResult = await searchPolicies(query);
      if (ragResult && (ragResult.answer || ragResult.references.length > 0)) {
        return {
          result: {
            answer: ragResult.answer || "See the retrieved policy excerpts below.",
            references: ragResult.references.map((ref) => ({
              title: ref.source || "Policy Document",
              clause: ref.section || "",
              excerpt: ref.content,
              confidence: ref.confidence,
            })),
          },
          model: "RAG + GPT-4.1",
          fallback: false,
        };
      }
    }
  } catch (e) {
    console.warn("RAG policy search failed, falling back to LLM-only:", e);
  }

  // 2. Fallback: LLM-only policy query
  const { policyRAG } = MODEL_CONFIG;

  const systemPrompt = `You are a telecom policy research assistant with expertise in Indian telecom regulations (TRAI, DoT, MIB, PMLA). Users ask questions about internal policies, regulatory requirements, and compliance guidelines.

Answer the question by referencing relevant policy clauses. Return your response as JSON:

{
  "answer": "A clear, concise answer to the query (2-3 sentences)",
  "references": [
    {
      "title": "Policy document name",
      "clause": "Specific section/clause number",
      "excerpt": "Relevant excerpt from the policy (1-2 sentences)",
      "confidence": 0.0 to 1.0
    }
  ]
}

Known policy areas:
- TRAI QoS Regulations: Credit adjustments, SLA penalties, subscriber protection
- Internal SLA Policy v3.1: Bandwidth allocation, service levels, escalation procedures
- SLA Waiver Framework: Force majeure, customer-initiated changes, documentation requirements
- TRAI KYC/Subscriber Verification: Deferral rules, PMLA compliance, enterprise accounts
- Content Distribution Policy (MIB): Access exceptions, broadcasting guidelines, retention measures
- Emergency Deviation Protocol: SLA breach procedures, expedited approval, ratification requirements`;

  try {
    const result = await callWithFallback(
      policyRAG.model,
      policyRAG.label,
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: query },
      ],
      0.3,
      1024
    );

    try {
      const jsonStr = result.text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      const parsed = JSON.parse(jsonStr);
      return {
        result: parsed,
        model: result.label,
        fallback: result.fallback,
      };
    } catch {
      // Return raw answer if JSON parsing fails
      return {
        result: {
          answer: result.text,
          references: [],
        },
        model: result.label,
        fallback: result.fallback,
      };
    }
  } catch (error) {
    console.error("Policy RAG query failed:", error);
    return {
      result: { answer: "", references: [] },
      model: "none",
      fallback: true,
      error: error instanceof Error ? error.message : "AI service unavailable",
    };
  }
}

// ─── Analytics Insight Generation ───
export async function generateAnalyticsInsight(
  summaryData: string
): Promise<LLMResponse<string>> {
  const { analytics } = MODEL_CONFIG;

  const systemPrompt = `You are a telecom operations analytics AI. Analyze the deviation request metrics and produce a concise executive summary (3-4 sentences). Highlight key trends, concerns, and actionable recommendations. Reference specific metrics and percentages. Use professional telecom industry language.`;

  try {
    const result = await callWithFallback(
      analytics.model,
      analytics.label,
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze these deviation metrics and provide an executive insight summary:\n\n${summaryData}` },
      ],
      0.5,
      512
    );

    return {
      result: result.text,
      model: result.label,
      fallback: result.fallback,
    };
  } catch (error) {
    console.error("Analytics insight generation failed:", error);
    return {
      result: "",
      model: "none",
      fallback: true,
      error: error instanceof Error ? error.message : "AI service unavailable",
    };
  }
}

// ─── Check if LLM is configured ───
export function isLLMConfigured(): boolean {
  return !!LLM_API_KEY && LLM_API_KEY !== "your_llm_api_key_here";
}

export function getLLMStatus(): { configured: boolean; baseUrl: string } {
  return {
    configured: isLLMConfigured(),
    baseUrl: LLM_BASE_URL,
  };
}
