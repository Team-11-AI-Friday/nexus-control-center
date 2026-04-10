/**
 * RAG Service — Communicates with the Python FastAPI RAG backend
 *
 * This service provides the bridge between the DeviQ React frontend
 * and the FAISS-powered policy document search system.
 *
 * The RAG backend runs separately (see RAG/start_rag.bat).
 * If the backend is down, all functions gracefully return empty/fallback results.
 */

// ─── Configuration ───
const RAG_API_URL =
  import.meta.env.VITE_RAG_API_URL || "http://localhost:8001";
const LLM_API_KEY = import.meta.env.VITE_LLM_API_KEY || "";

// ─── Types ───

export interface RAGHealthStatus {
  status: "ok" | "offline";
  documents_loaded: boolean;
  document_count: number;
  index_ready: boolean;
}

export interface PolicyReference {
  content: string;
  source: string;
  page: number | null;
  section: string;
  confidence: number;
}

export interface PolicySearchResult {
  answer: string;
  references: PolicyReference[];
  query: string;
  total_results: number;
}

export interface RiskContextResult {
  context: string;
  references: PolicyReference[];
  message?: string;
}

// ─── Internal fetch wrapper with timeout + error handling ───

async function ragFetch<T>(
  endpoint: string,
  body?: Record<string, unknown>,
  timeoutMs = 30000
): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const options: RequestInit = {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    };

    if (body) {
      // Always inject the API key
      options.body = JSON.stringify({ api_key: LLM_API_KEY, ...body });
    }

    const response = await fetch(`${RAG_API_URL}${endpoint}`, options);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.warn(`RAG API ${endpoint} error (${response.status}): ${errorText}`);
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      console.warn(`RAG API ${endpoint} timed out after ${timeoutMs}ms`);
    } else {
      console.warn(`RAG API ${endpoint} unreachable:`, error);
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Public API ───

/**
 * Check if the RAG backend is running and has an index loaded.
 */
export async function checkRAGHealth(): Promise<RAGHealthStatus> {
  const result = await ragFetch<RAGHealthStatus>("/health", undefined, 3000);
  if (result) return result;

  return {
    status: "offline",
    documents_loaded: false,
    document_count: 0,
    index_ready: false,
  };
}

/**
 * Trigger the RAG backend to load/re-index PDFs from the data folder.
 */
export async function loadDocuments(
  folderPath = "data"
): Promise<{ success: boolean; message: string; document_count?: number }> {
  const result = await ragFetch<{
    status: string;
    message: string;
    document_count: number;
  }>("/load_documents", {
    folder_path: folderPath,
  }, 120000); // 2 min timeout for indexing

  if (result) {
    return {
      success: true,
      message: result.message,
      document_count: result.document_count,
    };
  }

  return {
    success: false,
    message: "Failed to connect to RAG server. Is it running?",
  };
}

/**
 * Search the policy document index with a natural language query.
 * Returns an AI-synthesized answer plus source citations from the actual PDFs.
 */
export async function searchPolicies(
  query: string,
  k = 5,
  chatModel = "azure/genailab-maas-gpt-4.1"
): Promise<PolicySearchResult | null> {
  return ragFetch<PolicySearchResult>("/policy_search", {
    query,
    k,
    chat_model: chatModel,
  }, 60000); // 60s timeout — the LLM call can be slow
}

/**
 * Retrieve policy context relevant to a specific deviation type.
 * Used to augment risk scoring and justification prompts with
 * real policy content from the indexed documents.
 */
export async function getRiskContext(
  deviationType: string,
  customerContext = "",
  k = 3
): Promise<RiskContextResult | null> {
  return ragFetch<RiskContextResult>("/risk_context", {
    deviation_type: deviationType,
    customer_context: customerContext,
    k,
  }, 15000);
}

/**
 * Convenience: check if the RAG backend is reachable and index-ready.
 */
export async function isRAGAvailable(): Promise<boolean> {
  const health = await checkRAGHealth();
  return health.status === "ok" && health.index_ready;
}
