import type { ReactNode } from 'react';
import { AdminNav } from './AdminNav';
import { supabaseAdminConfigured } from '@/lib/supabase';

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-graphite-900">
      <div className="m-stripe h-1 w-full" />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row md:gap-8 md:py-8">
        {/* Sidebar */}
        <aside className="md:w-60 md:shrink-0">
          <div className="mb-6 flex items-center gap-2.5">
            <span className="m-stripe-v h-7 w-1.5" />
            <span className="font-display text-2xl tracking-wide text-ink">BMW CODING · CMS</span>
          </div>
          <AdminNav />
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          {!supabaseAdminConfigured && (
            <div className="mb-6 rounded-lg border border-m-red/40 bg-m-red/10 p-4 text-sm text-ink">
              <strong>Supabase isn’t configured.</strong> Add{' '}
              <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code>,{' '}
              <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> and{' '}
              <code className="font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</code> in your
              environment, then run <code className="font-mono text-xs">supabase/schema.sql</code>.
              Until then, edits won’t save and the site shows default content.
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
