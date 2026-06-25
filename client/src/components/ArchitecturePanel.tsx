// client/src/components/ArchitecturePanel.tsx — Minimal architecture description
export default function ArchitecturePanel() {
  return (
    <div className="instrument-panel">
      <div className="panel-header">
        <span>Architecture</span>
      </div>
      <div className="space-y-4 text-[12px] text-muted-foreground">
        <div>
          <p className="text-foreground/70 uppercase text-[10px] tracking-[0.15em] mb-1">Input</p>
          <p>CSV upload, JSON paste, or synthetic sample</p>
        </div>
        <div>
          <p className="text-foreground/70 uppercase text-[10px] tracking-[0.15em] mb-1">Processing</p>
          <p>PGlite WASM &rarr; IndexedDB persistence &rarr; local SQL &rarr; aggregate views</p>
        </div>
        <div>
          <p className="text-foreground/70 uppercase text-[10px] tracking-[0.15em] mb-1">Network</p>
          <p>Static assets only (HTML, JS, CSS, WASM)</p>
        </div>
      </div>
    </div>
  );
}
