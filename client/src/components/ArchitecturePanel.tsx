// client/src/components/ArchitecturePanel.tsx — Visual architecture boundary panel
import { CircleDot, ArrowRight } from "lucide-react";

const LAYERS = [
  {
    label: "User Data Input",
    color: "text-chart-2",
    border: "border-[oklch(0.7_0.15_55/0.3)]",
    items: ["CSV file upload", "JSON paste", "Synthetic sample generator"],
  },
  {
    label: "Browser-Local Execution",
    color: "text-chart-1",
    border: "border-[oklch(0.7_0.1_145/0.3)]",
    items: [
      "PGlite WASM (Postgres in browser)",
      "IndexedDB persistence (idb://)",
      "Local PostgreSQL SQL execution",
      "Predefined aggregate views",
      "Bounded reasoning tools",
    ],
  },
  {
    label: "External Network",
    color: "text-muted-foreground",
    border: "border-border",
    items: ["Static HTML, JS, CSS, WASM assets only"],
  },
];

export default function ArchitecturePanel() {
  return (
    <div className="instrument-panel">
      <div className="panel-header">
        <CircleDot className="w-2.5 h-2.5 text-primary" />
        <span>Runtime Architecture</span>
      </div>

      <div className="p-4 space-y-3">
        <p className="text-xs text-muted-foreground">
          Raw records remain inside the browser. No patient-level data is posted to a server.
        </p>

        <div className="space-y-2">
          {LAYERS.map((layer, i) => (
            <div key={layer.label}>
              <div className={`border ${layer.border} rounded-sm p-3`}>
                <p className={`text-[10px] uppercase tracking-wider font-mono mb-1.5 ${layer.color}`}>
                  {layer.label}
                </p>
                <ul className="space-y-0.5">
                  {layer.items.map((item) => (
                    <li key={item} className="text-[11px] text-foreground/80 font-mono flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-current opacity-40 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              {i < LAYERS.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowRight className="w-3 h-3 text-muted-foreground rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
