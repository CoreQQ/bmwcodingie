/**
 * Site logo — full brand lockup served from /public/logo.png.
 * Put the file at: public/logo.png
 */
export function Logo({ className = 'h-9 w-auto' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="BMW Coding IE"
      fetchPriority="high"
      className={`${className} select-none object-contain transition-transform duration-300 group-hover:scale-105`}
    />
  );
}
