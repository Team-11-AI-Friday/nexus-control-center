import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { queryPolicyLibrary, isLLMConfigured } from "@/services/llm.service";
import {
  searchPolicies,
  checkRAGHealth,
  loadDocuments,
  type RAGHealthStatus,
  type PolicyReference as RAGReference,
} from "@/services/rag.service";
import { policyReferences } from "@/data/deviations";
import {
  Search,
  BookOpen,
  Sparkles,
  Cpu,
  Clock,
  Database,
  RefreshCw,
  Zap,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Upload,
  BrainCircuit,
} from "lucide-react";

interface QueryHistoryItem {
  query: string;
  timestamp: string;
  source: "rag" | "llm" | "local";
}

interface PolicyResult {
  title: string;
  clause: string;
  excerpt: string;
  confidence: number;
  page?: number | null;
  source?: string;
}

export default function PolicyLibraryPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [references, setReferences] = useState<PolicyResult[]>([]);
  const [model, setModel] = useState("");
  const [answerSource, setAnswerSource] = useState<"rag" | "llm" | "local" | "">(
    ""
  );
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);

  // RAG backend status
  const [ragHealth, setRagHealth] = useState<RAGHealthStatus>({
    status: "offline",
    documents_loaded: false,
    document_count: 0,
    index_ready: false,
  });
  const [ragChecking, setRagChecking] = useState(true);
  const [indexing, setIndexing] = useState(false);

  // Check RAG health on mount and periodically
  const refreshHealth = useCallback(async () => {
    setRagChecking(true);
    const health = await checkRAGHealth();
    setRagHealth(health);
    setRagChecking(false);
  }, []);

  useEffect(() => {
    refreshHealth();
    const interval = setInterval(refreshHealth, 30000); // re-check every 30s
    return () => clearInterval(interval);
  }, [refreshHealth]);

  // Handle document indexing
  const handleIndexDocuments = async () => {
    setIndexing(true);
    const result = await loadDocuments("data");
    if (result.success) {
      await refreshHealth();
    }
    setIndexing(false);
  };

  // ── Search Logic: RAG first → LLM fallback → local fallback ──
  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setAnswer("");
    setReferences([]);
    setModel("");
    setAnswerSource("");

    let searchSuccess = false;

    // 1. Try RAG backend first (if available)
    if (ragHealth.status === "ok" && ragHealth.index_ready) {
      const ragResult = await searchPolicies(query);
      if (ragResult && ragResult.references.length > 0) {
        setAnswer(ragResult.answer || "");
        setReferences(
          ragResult.references.map((ref: RAGReference) => ({
            title: ref.source || "Policy Document",
            clause: ref.section || "",
            excerpt: ref.content,
            confidence: ref.confidence,
            page: ref.page,
            source: ref.source,
          }))
        );
        setModel("RAG + GPT-4.1");
        setAnswerSource("rag");
        searchSuccess = true;
      }
    }

    // 2. Fallback: LLM-only search (if RAG failed or unavailable)
    if (!searchSuccess && isLLMConfigured()) {
      const result = await queryPolicyLibrary(query);
      if (!result.error && result.result.answer) {
        setAnswer(result.result.answer || "");
        setReferences(
          (result.result.references || []).map(
            (r: { title: string; clause: string; excerpt: string; confidence: number }) => ({
              title: r.title,
              clause: r.clause,
              excerpt: r.excerpt,
              confidence: r.confidence,
            })
          )
        );
        setModel(result.model);
        setAnswerSource("llm");
        searchSuccess = true;
      }
    }

    // 3. Final fallback: local hardcoded search
    if (!searchSuccess) {
      setAnswer(
        "AI search is unavailable. Showing local policy matches below."
      );
      const localResults = policyReferences
        .filter(
          (p) =>
            p.title.toLowerCase().includes(query.toLowerCase()) ||
            p.excerpt.toLowerCase().includes(query.toLowerCase()) ||
            p.clause.toLowerCase().includes(query.toLowerCase())
        )
        .map((p) => ({
          title: p.title,
          clause: p.clause,
          excerpt: p.excerpt,
          confidence: p.confidenceScore,
        }));
      setReferences(localResults);
      setAnswerSource("local");
    }

    setQueryHistory((prev) => [
      {
        query,
        timestamp: new Date().toISOString(),
        source: answerSource || "local",
      },
      ...prev.filter((h) => h.query !== query).slice(0, 9),
    ]);
    setLoading(false);
  };

  const llmConfigured = isLLMConfigured();
  const ragOnline = ragHealth.status === "ok";
  const ragReady = ragOnline && ragHealth.index_ready;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Search */}
      <div className="lg:col-span-2 space-y-6">
        {/* ── RAG Status Banner ── */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  ragReady
                    ? "bg-emerald-500/10 text-emerald-400"
                    : ragOnline
                    ? "bg-amber-500/10 text-amber-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {ragChecking ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : ragReady ? (
                  <Database className="w-5 h-5" />
                ) : ragOnline ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                  RAG Engine
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      ragReady
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : ragOnline
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}
                  >
                    {ragChecking
                      ? "Checking..."
                      : ragReady
                      ? "Connected"
                      : ragOnline
                      ? "No Index"
                      : "Offline"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {ragReady
                    ? `FAISS index ready — ${ragHealth.document_count} document(s) indexed`
                    : ragOnline
                    ? "Server is running but no documents are indexed yet"
                    : "RAG server not detected — using LLM-only mode"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {ragOnline && !ragReady && (
                <Button
                  size="sm"
                  onClick={handleIndexDocuments}
                  disabled={indexing}
                  className="gradient-primary text-primary-foreground text-xs"
                >
                  {indexing ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Indexing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3 h-3 mr-1" />
                      Index Documents
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={refreshHealth}
                disabled={ragChecking}
                className="text-muted-foreground hover:text-foreground"
              >
                <RefreshCw
                  className={`w-4 h-4 ${ragChecking ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </GlassCard>

        {/* ── Search Bar ── */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Policy Library — {ragReady ? "RAG-Powered Search" : "AI Search"}
            </h3>
            {ragReady && (
              <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <BrainCircuit className="w-3 h-3" />
                FAISS Vector Search
              </span>
            )}
            {!ragReady && !llmConfigured && (
              <span className="text-[10px] text-warning ml-auto">
                ⚠ Offline mode — local search only
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={
                  ragReady
                    ? "Search policy documents with RAG (e.g., 'What are the rules for billing credits?')..."
                    : "Ask about policies, regulations, or compliance requirements..."
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10 bg-muted/30 border-border/30"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="gradient-primary text-primary-foreground"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full"
                />
              ) : (
                <>
                  {ragReady ? (
                    <Zap className="w-4 h-4 mr-2" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Search
                </>
              )}
            </Button>
          </div>

          {/* AI Answer */}
          <AnimatePresence>
            {(loading || answer) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4"
              >
                <div className="text-xs text-primary font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" />
                  {answerSource === "rag"
                    ? "RAG-Powered Analysis"
                    : answerSource === "llm"
                    ? "AI Analysis"
                    : "Local Search"}
                  <div className="ml-auto flex items-center gap-2">
                    {answerSource === "rag" && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <Database className="w-3 h-3" />
                        Vector Retrieved
                      </span>
                    )}
                    {model && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
                        <Cpu className="w-3 h-3" /> {model}
                      </span>
                    )}
                  </div>
                </div>
                {loading ? (
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                        className="w-2 h-2 rounded-full bg-primary"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {answer}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        {/* Citation Cards */}
        {references.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              {answerSource === "rag"
                ? "Retrieved Policy Excerpts"
                : "Policy References"}{" "}
              ({references.length})
            </h4>
            {references.map((ref, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassCard hover className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm font-semibold text-foreground">
                        {ref.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {ref.page && (
                        <span className="text-[10px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
                          Page {ref.page}
                        </span>
                      )}
                      <span
                        className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
                          ref.confidence > 0.7
                            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                            : ref.confidence > 0.4
                            ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                            : "text-muted-foreground bg-muted/10 border-border/30"
                        }`}
                      >
                        {Math.round((ref.confidence || 0) * 100)}% match
                      </span>
                    </div>
                  </div>
                  {ref.clause && (
                    <div className="text-xs text-primary font-mono mb-2">
                      {ref.clause}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {ref.excerpt}
                  </p>
                  {ref.source && answerSource === "rag" && (
                    <div className="mt-2 pt-2 border-t border-border/20 flex items-center gap-1 text-[10px] text-muted-foreground/60">
                      <FileText className="w-3 h-3" />
                      {ref.source}
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}

        {/* Default: Show all policies when no search */}
        {!answer && !loading && references.length === 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">
              Available Policies
            </h4>
            {policyReferences.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-semibold text-foreground">
                      {p.title}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {p.sourceDocument}
                    </span>
                  </div>
                  <div className="text-xs text-primary font-mono mb-1">
                    {p.clause}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {p.excerpt}
                  </p>
                </GlassCard>
              </motion.div>
            ))}

            {!ragReady && (
              <div className="text-xs text-muted-foreground text-center mt-4 p-4 rounded-lg bg-muted/10 border border-border/30">
                <Database className="w-6 h-6 mx-auto mb-2 text-primary/50" />
                <strong>RAG Enhancement Available:</strong> Start the RAG server
                (<code>RAG/start_rag.bat</code>) and index your policy PDFs for
                intelligent document-grounded search.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Sidebar ── */}
      <div className="space-y-6">
        {/* RAG Info Panel */}
        <GlassCard className="sticky top-20">
          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-primary" />
            Search Engine
          </h4>
          <div className="space-y-3">
            {/* RAG Status */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-foreground">FAISS RAG</span>
              </div>
              <span
                className={`text-[10px] font-mono flex items-center gap-1 ${
                  ragReady ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {ragReady ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                {ragReady ? "Active" : "Inactive"}
              </span>
            </div>

            {/* LLM Status */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-foreground">LLM Fallback</span>
              </div>
              <span
                className={`text-[10px] font-mono flex items-center gap-1 ${
                  llmConfigured ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {llmConfigured ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                {llmConfigured ? "Ready" : "No Key"}
              </span>
            </div>

            {/* Local Fallback */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-foreground">Local Policies</span>
              </div>
              <span className="text-[10px] font-mono flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                {policyReferences.length} loaded
              </span>
            </div>
          </div>

          {/* Indexing Action */}
          {ragOnline && !ragReady && (
            <div className="mt-4 pt-3 border-t border-border/30">
              <Button
                size="sm"
                className="w-full gradient-primary text-primary-foreground text-xs"
                onClick={handleIndexDocuments}
                disabled={indexing}
              >
                {indexing ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Building FAISS Index...
                  </>
                ) : (
                  <>
                    <Upload className="w-3 h-3 mr-1" />
                    Index Policy Documents
                  </>
                )}
              </Button>
            </div>
          )}

          {ragReady && (
            <div className="mt-4 pt-3 border-t border-border/30">
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs"
                onClick={handleIndexDocuments}
                disabled={indexing}
              >
                {indexing ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Re-indexing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Re-index Documents
                  </>
                )}
              </Button>
            </div>
          )}
        </GlassCard>

        {/* Query History */}
        <GlassCard>
          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Query History
          </h4>
          {queryHistory.length === 0 ? (
            <p className="text-xs text-muted-foreground">No queries yet</p>
          ) : (
            <div className="space-y-2">
              {queryHistory.map((item, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => {
                    setQuery(item.query);
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="text-xs text-foreground truncate flex items-center gap-1.5">
                    {item.source === "rag" ? (
                      <Database className="w-3 h-3 text-emerald-400 shrink-0" />
                    ) : item.source === "llm" ? (
                      <Cpu className="w-3 h-3 text-primary shrink-0" />
                    ) : (
                      <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                    )}
                    {item.query}
                  </div>
                  <div className="text-[9px] text-muted-foreground font-mono mt-0.5">
                    {new Date(item.timestamp).toLocaleString()}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
