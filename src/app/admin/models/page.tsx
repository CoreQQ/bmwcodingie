import Link from 'next/link';
import { Trash2, Plus, Save, ListChecks } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { PageHeading, Card, Field, aInput, aBtn, aBtnGhost, aBtnDanger } from '@/components/admin/ui';
import { ConfirmButton } from '@/components/admin/ConfirmButton';
import { adminGetCarModels, adminGetCompatibility } from '@/lib/admin-data';
import { createCarModel, updateCarModel, deleteCarModel } from '../actions';
import type { CarModel } from '@/lib/types';

export default async function ModelsAdmin() {
  const [models, compatibility] = await Promise.all([
    adminGetCarModels(),
    adminGetCompatibility(),
  ]);

  const countFor = (id: number) => compatibility.filter((c) => c.model_id === id).length;

  return (
    <AdminShell>
      <PageHeading
        title="Models"
        sub="Exact chassis + year, used by the public model picker at /models. Set per-model compatibility from each model's page."
      />

      <Card className="mb-8 p-5">
        <h2 className="mb-4 flex items-center gap-2 font-medium text-ink">
          <Plus size={16} className="text-bmw" /> Add a model
        </h2>
        <form action={createCarModel} className="grid gap-4 md:grid-cols-5 md:items-end">
          <Field label="Chassis code" hint="e.g. F30, G30, E90">
            <input name="chassis_code" required className={aInput} placeholder="F30" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Label">
              <input name="label" required className={aInput} placeholder="3 Series (F30/F31/F34)" />
            </Field>
          </div>
          <Field label="Year from">
            <input name="year_from" type="number" required className={aInput} placeholder="2012" />
          </Field>
          <Field label="Year to" hint="Leave blank if still current.">
            <input name="year_to" type="number" className={aInput} placeholder="2019" />
          </Field>
          <Field label="Sort order">
            <input name="sort_order" type="number" defaultValue={models.length + 1} className={aInput} />
          </Field>
          <div>
            <button type="submit" className={aBtn}>
              <Plus size={15} /> Add
            </button>
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        {models.map((m) => (
          <ModelEditor key={m.id} model={m} compatCount={countFor(m.id)} />
        ))}
        {models.length === 0 && (
          <p className="text-sm text-muted">No models yet — add one above.</p>
        )}
      </div>
    </AdminShell>
  );
}

function ModelEditor({ model, compatCount }: { model: CarModel; compatCount: number }) {
  return (
    <Card className="p-4">
      <form action={updateCarModel} className="grid gap-3 md:grid-cols-12 md:items-end">
        <input type="hidden" name="id" value={model.id} />
        <div className="md:col-span-2">
          <Field label="Chassis">
            <input name="chassis_code" defaultValue={model.chassis_code} className={aInput} />
          </Field>
        </div>
        <div className="md:col-span-4">
          <Field label="Label">
            <input name="label" defaultValue={model.label} className={aInput} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Year from">
            <input name="year_from" type="number" defaultValue={model.year_from} className={aInput} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Year to">
            <input name="year_to" type="number" defaultValue={model.year_to ?? ''} className={aInput} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Order">
            <input name="sort_order" type="number" defaultValue={model.sort_order} className={aInput} />
          </Field>
        </div>
        <div className="flex justify-end gap-2 md:col-span-12">
          <button type="submit" className={aBtnGhost}>
            <Save size={14} /> Save
          </button>
        </div>
      </form>

      <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
        <Link href={`/admin/models/${model.id}`} className={aBtnGhost}>
          <ListChecks size={14} /> Edit compatibility ({compatCount})
        </Link>
        <form action={deleteCarModel}>
          <input type="hidden" name="id" value={model.id} />
          <ConfirmButton className={aBtnDanger} message={`Delete "${model.label}"? Its compatibility data will be lost.`}>
            <Trash2 size={14} /> Delete
          </ConfirmButton>
        </form>
      </div>
    </Card>
  );
}
