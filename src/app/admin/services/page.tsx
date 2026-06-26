import { Trash2, Plus, Save } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { PageHeading, Card, Field, aInput, aBtn, aBtnGhost, aBtnDanger } from '@/components/admin/ui';
import { ConfirmButton } from '@/components/admin/ConfirmButton';
import { TranslationEditor } from '@/components/admin/TranslationEditor';
import { adminGetServices, adminGetCategories } from '@/lib/admin-data';
import { createService, updateService, deleteService, updateServiceTranslation } from '../actions';
import type { Category, Service } from '@/lib/types';

export default async function ServicesAdmin() {
  const [services, categories] = await Promise.all([
    adminGetServices(),
    adminGetCategories(),
  ]);

  return (
    <AdminShell>
      <PageHeading title="Services" sub="Everything in the Services section. Hidden services stay off the live site." />

      {/* Create */}
      <Card className="mb-8 p-5">
        <h2 className="mb-4 flex items-center gap-2 font-medium text-ink">
          <Plus size={16} className="text-bmw" /> Add a service
        </h2>
        <form action={createService} className="grid gap-4 md:grid-cols-2">
          <Field label="Title">
            <input name="title" required className={aInput} placeholder="Apple CarPlay activation" />
          </Field>
          <Field label="Price label">
            <input name="price_label" className={aInput} placeholder="from €120 / On request" defaultValue="On request" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Description">
              <textarea name="description" rows={2} className={aInput} placeholder="Short, concrete description." />
            </Field>
          </div>
          <Field label="Category">
            <CategorySelect categories={categories} />
          </Field>
          <Field label="Sort order">
            <input name="sort_order" type="number" defaultValue={0} className={aInput} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" name="mobile_available" defaultChecked className="accent-bmw" />
            Remote available
          </label>
          <div className="flex items-end">
            <button type="submit" className={aBtn}>
              <Plus size={15} /> Add service
            </button>
          </div>
        </form>
      </Card>

      {/* List grouped by category */}
      <div className="space-y-6">
        {categories.map((cat) => {
          const rows = services.filter((s) => s.category_id === cat.id);
          if (rows.length === 0) return null;
          return (
            <div key={cat.id}>
              <h3 className="mb-3 font-display text-2xl tracking-wide text-muted">{cat.name}</h3>
              <div className="space-y-3">
                {rows.map((s) => (
                  <ServiceEditor key={s.id} service={s} categories={categories} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Uncategorised */}
        {(() => {
          const rows = services.filter((s) => !s.category_id);
          if (rows.length === 0) return null;
          return (
            <div>
              <h3 className="mb-3 font-display text-2xl tracking-wide text-muted">Uncategorised</h3>
              <div className="space-y-3">
                {rows.map((s) => (
                  <ServiceEditor key={s.id} service={s} categories={categories} />
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </AdminShell>
  );
}

function ServiceEditor({ service, categories }: { service: Service; categories: Category[] }) {
  return (
    <Card className={`p-4 ${service.visible ? '' : 'opacity-60'}`}>
      <form action={updateService} className="grid gap-3 md:grid-cols-12 md:items-end">
        <input type="hidden" name="id" value={service.id} />
        <div className="md:col-span-4">
          <Field label="Title">
            <input name="title" defaultValue={service.title} className={aInput} />
          </Field>
        </div>
        <div className="md:col-span-3">
          <Field label="Price">
            <input name="price_label" defaultValue={service.price_label} className={aInput} />
          </Field>
        </div>
        <div className="md:col-span-3">
          <Field label="Category">
            <CategorySelect categories={categories} value={service.category_id} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Order">
            <input name="sort_order" type="number" defaultValue={service.sort_order} className={aInput} />
          </Field>
        </div>
        <div className="md:col-span-12">
          <Field label="Description">
            <textarea name="description" rows={2} defaultValue={service.description} className={aInput} />
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-5 md:col-span-8">
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" name="visible" defaultChecked={service.visible} className="accent-bmw" />
            Visible on site
          </label>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" name="mobile_available" defaultChecked={service.mobile_available} className="accent-bmw" />
            Remote available
          </label>
        </div>
        <div className="flex justify-end gap-2 md:col-span-4">
          <button type="submit" className={aBtnGhost}>
            <Save size={14} /> Save
          </button>
        </div>
      </form>

      <TranslationEditor
        id={service.id}
        translations={service.translations}
        action={updateServiceTranslation}
        fields={[
          { name: 'title', label: 'Title' },
          { name: 'price_label', label: 'Price label' },
          { name: 'description', label: 'Description', multiline: true },
        ]}
      />

      <form action={deleteService} className="mt-2 flex justify-end border-t border-white/5 pt-2">
        <input type="hidden" name="id" value={service.id} />
        <ConfirmButton className={aBtnDanger} message={`Delete "${service.title}"?`}>
          <Trash2 size={14} /> Delete
        </ConfirmButton>
      </form>
    </Card>
  );
}

function CategorySelect({ categories, value }: { categories: Category[]; value?: number | null }) {
  return (
    <select name="category_id" defaultValue={value ?? ''} className={aInput}>
      <option value="">— none —</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id} className="bg-graphite-800">
          {c.name}
        </option>
      ))}
    </select>
  );
}
