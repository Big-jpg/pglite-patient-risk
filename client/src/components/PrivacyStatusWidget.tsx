// client/src/components/PrivacyStatusWidget.tsx — Minimal privacy status
export default function PrivacyStatusWidget() {
  const fields = [
    { label: "Runtime", value: "Static client-side" },
    { label: "API routes", value: "None" },
    { label: "PHI uploaded", value: "0 bytes" },
    { label: "Storage", value: "IndexedDB / idb://" },
    { label: "Reasoning", value: "Aggregate-only" },
  ];
  return (
    <div className="instrument-panel">
      <div className="panel-header">
        <span>Privacy Status</span>
      </div>
      <div className="space-y-1.5">
        {fields.map((f) => (
          <div key={f.label} className="flex items-center justify-between text-[12px]">
            <span className="text-muted-foreground">{f.label}</span>
            <span className="text-foreground/80">{f.value}</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground/50 mt-4">
        Verify via DevTools &rarr; Network tab.
      </p>
    </div>
  );
}
