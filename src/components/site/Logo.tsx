/**
 * Site logo — transparent brand lockup served from /public/logo.webp (logo.png stays for JSON-LD).
 * Put the file at: public/logo.png (PNG with a transparent background).
 */
export function Logo({ className = 'h-9 w-auto' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.webp"
      alt="BMW Coding — BMW coding, diagnostics & retrofits in Dublin and across Ireland"
      fetchPriority="high"
      width={384}
      height={384}
      className={`${className} select-none object-contain transition-transform duration-300 group-hover:scale-105`}
    />
  );
}
