"use client";

import { btn } from "@/components/ui";

export function PrintButton() {
  return (
    <button type="button" className={btn.secondary} onClick={() => window.print()}>
      🖨️ Print / PDF
    </button>
  );
}
