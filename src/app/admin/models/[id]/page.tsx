import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { PageHeading, Card, Field, aInput, aBtn, aBtnGhost } from '@/components/admin/ui';
import {
  adminGetCarModels,
  adminGetCategories,
  adminGetServices,
  adminGetCompatibility,
} from '@/lib/admin-data';
import { saveCompatibility } from '../../actions';
import type { CompatibilityStatus } from '@/lib/types';

export default async function ModelCompatibilityAdmin({ params }: { params: { id: string } }) {
  const modelId = Number(params.id);
  const [models, categories, services, compatibility] = await Promise.all([
    adminGetCarModels(),
    adminGetCategories(),
    adminGetServices(),
    adminGetCompatibility(),
  ]);

  const model = models.find((m) => m.id === modelId);
  if (!model) notFound();

  const statusFor = (serviceId: number): CompatibilityStatus =>
    compatibility.find((c) => c.model_id === modelId && c.service_id === serviceId)?.status ??
    'on_request';
  const noteFor = (serviceId: number): string =>
    compatibility.find((c) => c.model_id === modelId && c.service_id === serviceId)?.note ?? '';

  return (
    <AdminShell>
      <Link href="/admin/models" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
        <ArrowLeft size={14} /> Back to models
      </Link>
      <PageHeading
        title={`${model.chassis_code} compatibility`}
        sub={`${model.label} · ${model.year_from}–${model.year_to ?? 'present'} — what's available on this exact model.`}
      />

      <form action={saveCompatibility} className="space-y-6">
        <input type="hidden" name="model_id" value={model.id} />

        {categories.map((cat) => {
          const rows = services.filter((s) => s.category_id === cat.id);
          if (rows.length === 0) return null;
          return (
            <div key={cat.id}>
              <h3 className="mb-3 font-display text-2xl tracking-wide text-muted">{cat.name}</h3>
              <div className="space-y-3">
                {rows.map((s) => (
                  <Card key={s.id} className="p-4">
                    <div className="grid gap-3 md:grid-cols-12 md:items-end">
                      <div className="md:col-span-5">
                        <p className="text-sm font-medium text-ink">{s.title}</p>
                        <p className="mt-0.5 text-xs text-faint">{s.price_label}</p>
                      </div>
                      <div className="md:col-span-3">
                        <Field label="Status">
                          <select name={`status_${s.id}`} defaultValue={statusFor(s.id)} className={aInput}>
                            <option value="yes" className="bg-graphite-800">Available</option>
                            <option value="no" className="bg-graphite-800">Not available</option>
                            <option value="on_request" className="bg-graphite-800">On request</option>
                          </select>
                        </Field>
                      </div>
                      <div className="md:col-span-4">
                        <Field label="Note" hint="Optional — shown to visitors.">
                          <input name={`note_${s.id}`} defaultValue={noteFor(s.id)} className={aInput} />
                        </Field>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}

        {services.length === 0 ? (
          <p className="text-sm text-muted">Add services first under Admin → Services.</p>
        ) : (
          <div className="flex justify-end">
            <button type="submit" className={aBtn}>
              <Save size={15} /> Save compatibility
            </button>
          </div>
        )}
      </form>

      <Link href="/admin/models" className={`${aBtnGhost} mt-6 inline-flex`}>
        <ArrowLeft size={14} /> Back to models
      </Link>
    </AdminShell>
  );
}
