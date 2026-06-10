LOGO + FAVICON SETUP

1) Site logo (header/footer):
   Put your file here:  public/logo.png

2) Favicon (browser tab):
   Copy the same image to:  src/app/icon.png
   e.g.  cp public/logo.png src/app/icon.png
   Next.js auto-uses it and adds a cache-busting hash.
   For a crisp tab icon a square PNG works best.

3) Remove any old icon that overrides it:
   src/app/favicon.ico  ->  delete it if present
