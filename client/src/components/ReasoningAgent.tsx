// client/src/components/ReasoningAgent.tsx — Bounded reasoning agent (simplified)
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useDatabase } from "@/contexts/DatabaseContext";
import {
  getRiskBandDistribution,
  getMissingnessSummary,
  getRegionalRiskSummary,
  getAgeBandRiskSummary,
  getRecordCount,
  getDistinctPatientCount,
} from "@/lib/database";

interface Message {
  role: "user" | "assistant";
  content: string;
  provenance?: { tool: string; timestamp: string };
}

const TOOLS: Record<string, { description: string; fn: () => Promise<any> }> = {
  getRiskBandDistribution: { description: "Risk band counts", fn: getRiskBandDistribution },
  getMissingnessSummary: { description: "Missing value percentages", fn: getMissingnessSummary },
  getRegionalRiskSummary: { description: "Risk by region", fn: getRegionalRiskSummary },
  getAgeBandRiskSummary: { description: "Risk by age decade", fn: getAgeBandRiskSummary },
  getRecordCount: { description: "Total records", fn: getRecordCount },
  getDistinctPatientCount: { description: "Distinct patients", fn: getDistinctPatientCount },
};

function matchTool(input: string): string | null {
  const lower = input.toLowerCase();
  if (lower.includes("risk") && lower.includes("region")) return "getRegionalRiskSummary";
  if (lower.includes("risk") && lower.includes("age")) return "getAgeBandRiskSummary";
  if (lower.includes("risk") || lower.includes("band") || lower.includes("distribution")) return "getRiskBandDistribution";
  if (lower.includes("missing")) return "getMissingnessSummary";
  if (lower.includes("count") || lower.includes("how many") || lower.includes("total")) return "getRecordCount";
  if (lower.includes("patient")) return "getDistinctPatientCount";
  return null;
}

export default function ReasoningAgent() {
  const { recordCount } = useDatabase();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showCapabilities, setShowCapabilities] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || recordCount === 0) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setProcessing(true);

    const toolName = matchTool(userMsg.content);
    let response: Message;

    if (toolName && TOOLS[toolName]) {
      try {
        const result = await TOOLS[toolName].fn();
        const formatted = JSON.stringify(result, null, 2);
        response = {
          role: "assistant",
          content: formatted,
          provenance: { tool: toolName, timestamp: new Date().toLocaleTimeString() },
        };
      } catch (err: any) {
        response = { role: "assistant", content: "Error: " + err.message };
      }
    } else {
      response = {
        role: "assistant",
        content: "I can only answer questions using predefined aggregate queries. Try asking about risk distribution, missingness, regional patterns, or patient counts.",
      };
    }

    setMessages((prev) => [...prev, response]);
    setProcessing(false);
  };

  return (
    <div className="instrument-panel">
      <div className="panel-header">
        <span>Reasoning Agent</span>
        <span className="ml-auto text-[9px] text-primary/60 normal-case tracking-normal">aggregate-only</span>
      </div>

      <div className="space-y-3">
        {/* Capability toggle */}
        <button
          onClick={() => setShowCapabilities(!showCapabilities)}
          className="text-[11px] text-muted-foreground/70 hover:text-muted-foreground transition-colors"
        >
          {showCapabilities ? "Hide" : "Show"} capabilities
        </button>

        {showCapabilities && (
          <div className="text-[11px] text-muted-foreground space-y-2 pb-2">
            <div>
              <p className="text-foreground/50 uppercase text-[9px] tracking-wider mb-1">Can</p>
              <p>Query predefined aggregate views, report distributions, summarise missingness, compare regional aggregates</p>
            </div>
            <div>
              <p className="text-foreground/50 uppercase text-[9px] tracking-wider mb-1">Cannot</p>
              <p>Access raw rows, execute arbitrary SQL, transmit data externally, receive patient IDs</p>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="max-h-64 overflow-y-auto space-y-2">
          {messages.map((msg, i) => (
            <div key={i} className={msg.role === "user" ? "text-foreground/90" : "text-muted-foreground"}>
              <pre className="text-[11px] whitespace-pre-wrap">{msg.content}</pre>
              {msg.provenance && (
                <p className="text-[9px] text-primary/50 mt-0.5">
                  via {msg.provenance.tool} at {msg.provenance.timestamp}
                </p>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={recordCount === 0 ? "Load data first..." : "Ask about the data..."}
            disabled={recordCount === 0 || processing}
            className="flex-1 bg-input border-0 rounded-sm px-3 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <Button size="sm" type="submit" disabled={recordCount === 0 || processing} className="text-[11px] px-3">
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
