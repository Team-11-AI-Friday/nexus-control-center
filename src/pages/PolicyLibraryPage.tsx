import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { mockPolicyReferences } from "@/data/mockData";
import { Search, Sparkles, BookOpen, Clock } from "lucide-react";

interface QueryResult {
  query: string;
  results: typeof mockPolicyReferences;
  timestamp: string;
}

export default function PolicyLibraryPage() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [currentResults, setCurrentResults] = useState<typeof mockPolicyReferences>([]);
  const [history, setHistory] = useState<QueryResult[]>([
    {
      query: "What is the credit adjustment policy?",
      results: [mockPolicyReferences[0]],
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      query: "KYC deferral rules for enterprise",
      results: [mockPolicyReferences[3]],
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    },
  ]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setCurrentResults([]);

    await new Promise(r => setTimeout(r, 1500));

    // Simulate matching
    const results = mockPolicyReferences.filter(p =>
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(query.toLowerCase()) ||
      query.toLowerCase().includes(p.title.split(" ")[0].toLowerCase())
    );
    const finalResults = results.length > 0 ? results : mockPolicyReferences.slice(0, 3);

    setCurrentResults(finalResults);
    setHistory(prev => [{
      query,
      results: finalResults,
      timestamp: new Date().toISOString(),
    }, ...prev]);
    setSearching(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* History */}
      <div className="lg:col-span-1 space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4" /> Query History
        </h3>
        {history.map((h, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <button
              onClick={() => { setQuery(h.query); setCurrentResults(h.results); }}
              className="w-full text-left p-3 rounded-lg bg-muted/20 border border-border/30 hover:border-border/50 transition-colors"
            >
              <div className="text-xs text-foreground line-clamp-2">{h.query}</div>
              <div className="text-[10px] text-muted-foreground font-mono mt-1">
                {new Date(h.timestamp).toLocaleTimeString()}
              </div>
            </button>
          </motion.div>
        ))}
      </div>

      {/* Main */}
      <div className="lg:col-span-3 space-y-6">
        {/* Search */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Ask the Policy AI</h2>
          </div>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Ask about billing policies, SLA waivers, compliance rules..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                className="pl-9 bg-muted/30 border-border/30"
              />
            </div>
            <Button onClick={handleSearch} disabled={searching} className="gradient-primary text-primary-foreground">
              {searching ? "Searching..." : "Search"}
            </Button>
          </div>
        </GlassCard>

        {/* AI Processing Animation */}
        {searching && (
          <GlassCard className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-16 h-16">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary"
                />
                <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Analyzing policy documents...</span>
            </div>
          </GlassCard>
        )}

        {/* Results */}
        {!searching && currentResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{currentResults.length} Policy References Found</h3>
            {currentResults.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassCard hover>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{p.title}</h4>
                      <span className="text-[10px] font-mono text-muted-foreground">{p.clause}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                        {Math.round(p.confidenceScore * 100)}% match
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed mb-3">{p.excerpt}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted/30 text-muted-foreground font-mono">
                      📄 {p.sourceDocument}
                    </span>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
