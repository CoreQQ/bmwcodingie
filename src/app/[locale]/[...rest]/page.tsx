import { notFound } from 'next/navigation';

// Any path under a locale that doesn't match a real route lands here and
// triggers the styled not-found page ([locale]/not-found.tsx). Real routes
// like /models or /payment take precedence over this catch-all.
export default function CatchAll() {
  notFound();
}
