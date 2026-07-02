'use client';

import dynamic from 'next/dynamic';

// Loads the chat widget in its own chunk after hydration — it's
// interaction-only UI and doesn't belong in the critical bundle.
export const ChatWidgetLazy = dynamic(
  () => import('./ChatWidget').then((m) => m.ChatWidget),
  { ssr: false },
);
