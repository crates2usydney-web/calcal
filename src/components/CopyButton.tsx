"use client";

import { useState } from "react";

export function CopyButton({ path, label = "Copy link" }: { path: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.origin + path);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          setCopied(false);
        }
      }}
      className="rounded-lg border border-line px-3 py-2 text-[12.5px] font-medium text-navy hover:border-navy/30"
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}
