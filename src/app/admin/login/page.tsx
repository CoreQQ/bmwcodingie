import { login } from '../actions';
import { aInput, aBtn } from '@/components/admin/ui';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const hasError = searchParams?.error === '1';

  return (
    <div className="flex min-h-screen items-center justify-center bg-graphite-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-3">
          <span className="m-stripe-v h-9 w-1.5" />
          <span className="font-display text-3xl tracking-wide text-ink">BMW CODING · CMS</span>
        </div>

        <div className="overflow-hidden rounded-lg border border-white/10 bg-graphite-800/60">
          <div className="m-stripe h-1 w-full" />
          <form action={login} className="space-y-4 p-6">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-faint">
                Owner password
              </label>
              <input
                type="password"
                name="password"
                autoFocus
                required
                placeholder="••••••••"
                className={aInput}
              />
            </div>
            {hasError && (
              <p className="text-sm text-m-red">Incorrect password. Try again.</p>
            )}
            <button type="submit" className={`${aBtn} w-full`}>
              Sign in
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-faint">
          Restricted area — owner access only.
        </p>
      </div>
    </div>
  );
}
