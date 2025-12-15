import { Loader2 } from "lucide-react";

export function Spinner({ size = 24, className = "", label = "Loading…" }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex items-center justify-center"
    >
      <Loader2
        className={`animate-spin text-muted-foreground ${className}`}
        style={{ width: size, height: size }}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export default Spinner;