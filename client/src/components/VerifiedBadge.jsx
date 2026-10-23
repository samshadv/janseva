import React from "react";
import { ShieldCheck } from "lucide-react";

export function VerifiedBadge({ domain }) {
  return (
    <span className="gov-verified-pill" title="Cross-referenced with official Government of India domain registry">
      <ShieldCheck size={12} />
      <span>Official Portal</span>
    </span>
  );
}
