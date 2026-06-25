// client/src/components/PrivacyBanner.tsx — Minimal privacy boundary marker
export default function PrivacyBanner() {
  return (
    <div className="border-t border-dashed border-muted-foreground/30">
      <div className="container py-4">
        <p className="text-sm text-muted-foreground">
          Client-side execution boundary &mdash; raw records do not cross this line.
        </p>
      </div>
    </div>
  );
}
