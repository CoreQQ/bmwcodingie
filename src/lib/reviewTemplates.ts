// Ready-to-send review-request messages. These help you ask REAL customers
// for HONEST reviews — never fake, incentivised or bulk reviews (that breaks
// Google's policies and risks the whole Business Profile). The link points at
// GOOGLE_REVIEW_URL when it's set.

const REVIEW_URL = process.env.GOOGLE_REVIEW_URL || '';

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || 'there';
}

export type ReviewTemplate = { key: string; label: string; build: (name: string, service: string) => string };

export const REVIEW_TEMPLATES: ReviewTemplate[] = [
  {
    key: 'short',
    label: 'Short & friendly',
    build: (name, service) => {
      const svc = service ? ` with the ${service}` : '';
      return `Hi ${firstName(name)}! Thanks for trusting us with your BMW${svc}. If you have 30 seconds, a quick Google review would mean a lot to us: ${REVIEW_URL}`;
    },
  },
  {
    key: 'warm',
    label: 'Warm / personal',
    build: (name, service) => {
      const svc = service ? ` Hope you're enjoying the ${service}!` : '';
      return `Hi ${firstName(name)}, it was great sorting your BMW today.${svc} We're a small independent team and honest Google reviews are what help other BMW owners find us — if you had a good experience, a few words here would genuinely help: ${REVIEW_URL}`;
    },
  },
  {
    key: 'concise',
    label: 'Straight to the point',
    build: (name) =>
      `Hi ${firstName(name)} — thanks again! Would you mind leaving us a quick Google review? It only takes a moment: ${REVIEW_URL}`,
  },
  {
    key: 'followup',
    label: 'Gentle follow-up',
    build: (name) =>
      `Hi ${firstName(name)}, hope the BMW's still running great! No pressure at all — if you get a spare minute, a quick Google review would really help us out: ${REVIEW_URL}`,
  },
];

export function hasReviewUrl(): boolean {
  return Boolean(REVIEW_URL);
}
