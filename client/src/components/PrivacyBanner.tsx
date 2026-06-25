// client/src/components/PrivacyBanner.tsx — Minimal privacy boundary marker
export default function PrivacyBanner() {
  return (
    <div className="border-t border-dashed border-primary/30">
      <div className="container py-3">
        <p className="text-[11px] text-primary/70 tracking-wide">
          Client-side execution boundary &mdash; raw records do not cross this line.
        </p>
      </div>
    </div>
  );
}
