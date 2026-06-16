'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const FIELDS = [
  { label: 'IBAN', value: 'IE53AIBK93334153254033' },
  { label: 'BIC', value: 'AIBKIE2D' },
  { label: 'Recipient', value: 'Oleksandr Rudenko' },
];

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center justify-between border border-white/10 bg-graphite-800 px-5 py-4">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-wider text-faint">{label}</p>
        <p className="mt-1 font-mono text-lg text-ink">{value}</p>
      </div>
      <button
        onClick={copy}
        aria-label={`Copy ${label}`}
        className="ml-6 flex h-9 w-9 shrink-0 items-center justify-center border border-white/10 text-muted transition-colors hover:border-bmw hover:text-bmw"
      >
        {copied ? <Check size={16} className="text-bmw" /> : <Copy size={16} />}
      </button>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <div className="grain relative min-h-screen">
      <div className="mx-auto max-w-lg px-5 py-20 md:py-32">
        <div className="mb-2 flex items-center gap-3">
          <span className="label">BMW Coding IE</span>
          <span className="m-stripe h-[2px] w-8" />
        </div>
        <h1 className="font-display text-[clamp(2.5rem,8vw,4rem)] leading-[0.9]">
          PAYMENT<br />DETAILS
        </h1>
        <p className="mt-4 text-sm text-muted">
          Bank transfer — tap any field to copy.
        </p>

        <div className="mt-10 space-y-3">
          {FIELDS.map((f) => (
            <CopyField key={f.label} {...f} />
          ))}
        </div>

        <p className="mt-8 text-xs text-faint">
          Please include your name or booking reference in the payment description.
        </p>
      </div>
    </div>
  );
}
