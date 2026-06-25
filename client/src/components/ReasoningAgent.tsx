// client/src/components/ReasoningAgent.tsx — Bounded reasoning agent (aggregate-only AI mode)
import { useState, useRef, useEffect } from "react";
import { CircleDot, Send, AlertTriangle, XCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDatabase } from "@/contexts/DatabaseContext";
import {
  getRiskBandDistribution,
  getMissingnessSummary,
  getRegionalRiskSummary,
  getAgeBandRiskSummary,
  getRecordCount,
  getDistinctPatientCount,
} from "@/lib/database";

// Capability matrix — requirement #4
const CAPABILITIES = {
  can: [
    "Query predefined aggregate views",
    "Report risk band distributions",
    "Summarise missingness rates",
    "Compare regional/age-band aggregates",
  ],
  cannot: [
    "Access raw patient rows",
    "Execute arbitrary SQL",
    "Transmit data to external endpoints",
    "Receive patient_id or row-level observations",
  ],
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  provenance?: { tool: string; timestamp: string };
}

// Available tools that the agent can call — all return aggregates only
const TOOLS = {
  getRiskBandDistribution: {
    description: "Returns risk band counts (critical, high, metabolic, lipid, normal)",
    fn: getRiskBandDistribution,
  },
  getMissingnessSummary: {
    description: "Returns percentage of missing values per field",
    fn: getMissingnessSummary,
  },
  getRegionalRiskSummary: {
    description: "Returns risk band counts grouped by postcode region",
    fn: getRegionalRiskSummary,
  },
  getAgeBandRiskSummary: {
    description: "Returns risk band counts grouped by age decade",
    fn: getAgeBandRiskSummary,
  },
  getRecordCount: {
    description: "Returns total number of observation records",
    fn: getRecordCount,
  },
  getDistinctPatientCount: {
    description: "Returns number of distinct patients",
    fn: getDistinctPatientCount,
  },
};

type ToolName = keyof typeof TOOLS;

// Simple local reasoning engine that uses predefined tools
async function processQuery(userMessage: string): Promise<{ content: string; toolsUsed: string[] }> {
  const lower = userMessage.toLowerCase();

  // Determine which tools to call based on the question
  const toolsToCall: ToolName[] = [];

  if (lower.includes("risk") && (lower.includes("distribution") || lower.includes("band") || lower.includes("breakdown"))) {
    toolsToCall.push("getRiskBandDistribution");
  }
  if (lower.includes("missing") || lower.includes("quality") || lower.includes("completeness")) {
    toolsToCall.push("getMissingnessSummary");
  }
  if (lower.includes("region") || lower.includes("postcode") || lower.includes("area") || lower.includes("geographic")) {
    toolsToCall.push("getRegionalRiskSummary");
  }
  if (lower.includes("age") || lower.includes("decade") || lower.includes("older") || lower.includes("young")) {
    toolsToCall.push("getAgeBandRiskSummary");
  }
  if (lower.includes("count") || lower.includes("total") || lower.includes("how many") || lower.includes("records")) {
    toolsToCall.push("getRecordCount");
    toolsToCall.push("getDistinctPatientCount");
  }

  // Default: run all tools for general questions
  if (toolsToCall.length === 0) {
    toolsToCall.push("getRiskBandDistribution", "getRecordCount", "getDistinctPatientCount");
  }

  // Execute tools
  const results: Record<string, unknown> = {};
  for (const tool of toolsToCall) {
    try {
      results[tool] = await TOOLS[tool].fn();
    } catch (e) {
      results[tool] = `Error: ${e}`;
    }
  }

  // Format response
  return { content: formatResponse(userMessage, results), toolsUsed: toolsToCall };
}

function formatResponse(_question: string, data: Record<string, unknown>): string {
  const parts: string[] = [];

  if (data.getRecordCount !== undefined || data.getDistinctPatientCount !== undefined) {
    parts.push(`Dataset Overview: ${data.getRecordCount ?? "?"} total observations across ${data.getDistinctPatientCount ?? "?"} distinct patients.`);
  }

  if (data.getRiskBandDistribution) {
    const dist = data.getRiskBandDistribution as Record<string, number>;
    const total = Object.values(dist).reduce((a, b) => a + b, 0);
    const lines = Object.entries(dist)
      .sort((a, b) => b[1] - a[1])
      .map(([band, count]) => `  ${band}: ${count} (${total > 0 ? Math.round((count / total) * 100) : 0}%)`);
    parts.push(`Risk Distribution:\n${lines.join("\n")}`);

    const critical = dist.critical || 0;
    const high = dist.high || 0;
    if (critical + high > 0) {
      parts.push(`${critical + high} observations (${Math.round(((critical + high) / total) * 100)}%) are in elevated cardiovascular risk bands (critical + high).`);
    }
  }

  if (data.getMissingnessSummary) {
    const miss = data.getMissingnessSummary as Record<string, number>;
    const highMissing = Object.entries(miss).filter(([, v]) => v > 15);
    if (highMissing.length > 0) {
      parts.push(`Data Quality Concerns: Fields with >15% missing: ${highMissing.map(([k, v]) => `${k} (${v}%)`).join(", ")}.`);
    } else {
      parts.push(`Data Quality: All fields have acceptable completeness (<15% missing).`);
    }
  }

  if (data.getRegionalRiskSummary) {
    const regional = data.getRegionalRiskSummary as { rows: Record<string, unknown>[] };
    const criticalRegions = regional.rows.filter((r) => r.risk_band === "critical" || r.risk_band === "high");
    if (criticalRegions.length > 0) {
      const regionCounts: Record<string, number> = {};
      for (const r of criticalRegions) {
        const region = r.postcode_region as string;
        regionCounts[region] = (regionCounts[region] || 0) + (r.count as number);
      }
      const top3 = Object.entries(regionCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
      parts.push(`Regional Hotspots (elevated risk): ${top3.map(([r, c]) => `${r} (${c})`).join(", ")}.`);
    }
  }

  if (data.getAgeBandRiskSummary) {
    const ageBand = data.getAgeBandRiskSummary as { rows: Record<string, unknown>[] };
    const criticalAge = ageBand.rows.filter((r) => r.risk_band === "critical" || r.risk_band === "high");
    if (criticalAge.length > 0) {
      const ageCounts: Record<number, number> = {};
      for (const r of criticalAge) {
        const decade = r.age_decade as number;
        ageCounts[decade] = (ageCounts[decade] || 0) + (r.count as number);
      }
      const sorted = Object.entries(ageCounts).sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 3);
      parts.push(`Age-Risk Correlation: Highest elevated-risk concentrations in age decades: ${sorted.map(([d, c]) => `${d}s (${c})`).join(", ")}.`);
    }
  }

  if (parts.length === 0) {
    parts.push("I can provide aggregate summaries of the loaded patient data. Try asking about risk distribution, data quality, regional patterns, or age-related trends.");
  }

  parts.push("\n---\nAll data above is derived from aggregate queries on your local PGlite instance. No patient-level records were transmitted.");

  return parts.join("\n\n");
}

export default function ReasoningAgent() {
  const { recordCount } = useDatabase();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showCapabilities, setShowCapabilities] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || processing || recordCount === 0) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setProcessing(true);

    try {
      const { content, toolsUsed } = await processQuery(userMsg);
      const timestamp = new Date().toISOString();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content, provenance: { tool: toolsUsed.join(", "), timestamp } },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error processing query. Please try again." },
      ]);
    } finally {
      setProcessing(false);
    }
  };

  const handleSuggestion = (s: string) => {
    setInput(s);
  };

  const suggestions = [
    "What is the risk distribution?",
    "Are there data quality issues?",
    "Which regions have the highest risk?",
    "How does age correlate with risk?",
  ];

  return (
    <div className="instrument-panel flex flex-col">
      <div className="panel-header">
        <CircleDot className={`w-2.5 h-2.5 ${processing ? "text-primary led-pulse" : "text-muted-foreground"}`} />
        <span>Local Data Reasoning Demo</span>
        <Badge variant="outline" className="ml-auto text-[9px] font-mono normal-case tracking-normal">
          Aggregate-only AI mode
        </Badge>
      </div>

      {/* Guard rail notice */}
      <div className="px-4 py-2 border-b border-border bg-[oklch(0.7_0.15_55/0.05)]">
        <p className="text-[10px] text-[oklch(0.7_0.15_55)] flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          This agent receives only aggregate summaries from predefined queries. It cannot access patient IDs, row-level records, or execute arbitrary SQL.
        </p>
      </div>

      <div className="p-4 space-y-3 flex-1 flex flex-col">
        {/* Capability matrix toggle — requirement #4 */}
        <button
          onClick={() => setShowCapabilities(!showCapabilities)}
          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors text-left font-mono uppercase tracking-wider"
        >
          {showCapabilities ? "Hide" : "Show"} capability matrix
        </button>

        {showCapabilities && (
          <div className="grid grid-cols-2 gap-2 border border-border rounded-sm p-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-chart-1 font-mono mb-1.5">Can</p>
              <ul className="space-y-1">
                {CAPABILITIES.can.map((c) => (
                  <li key={c} className="text-[11px] text-foreground/80 flex items-start gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-chart-1 shrink-0 mt-0.5" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-destructive font-mono mb-1.5">Cannot</p>
              <ul className="space-y-1">
                {CAPABILITIES.cannot.map((c) => (
                  <li key={c} className="text-[11px] text-foreground/80 flex items-start gap-1.5">
                    <XCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 min-h-[180px] max-h-[360px]">
          {messages.length === 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Ask a question about the loaded dataset. Responses are generated from predefined aggregate queries only.
              </p>
              {recordCount > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSuggestion(s)}
                      className="text-[10px] px-2 py-1 rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`${msg.role === "user" ? "ml-8" : "mr-8"}`}>
              <div
                className={`rounded-sm px-3 py-2 text-xs ${
                  msg.role === "user"
                    ? "bg-primary/10 border border-primary/20 text-foreground"
                    : "bg-secondary border border-border text-foreground"
                }`}
              >
                <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
              </div>
              {/* Provenance block — requirement #5 */}
              {msg.provenance && (
                <div className="mt-1 px-1 text-[9px] font-mono text-muted-foreground/70">
                  Generated from: <code className="text-primary/70">{msg.provenance.tool}</code> at {msg.provenance.timestamp.split("T")[1]?.slice(0, 8)}
                </div>
              )}
            </div>
          ))}

          {processing && (
            <div className="mr-8">
              <div className="rounded-sm px-3 py-2 text-xs bg-secondary border border-border">
                <span className="text-muted-foreground">Querying local aggregates...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2 pt-2 border-t border-border">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={recordCount === 0 ? "Load data first..." : "Ask about aggregate patterns..."}
            disabled={recordCount === 0}
            className="flex-1 bg-background border border-border rounded-sm px-3 py-1.5 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!input.trim() || processing || recordCount === 0}
            className="h-7 w-7 p-0"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
