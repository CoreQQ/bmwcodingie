import { Trash2, Plus, Save } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { PageHeading, Card, Field, aInput, aBtn, aBtnGhost, aBtnDanger } from '@/components/admin/ui';
import { ConfirmButton } from '@/components/admin/ConfirmButton';
import { TranslationEditor } from '@/components/admin/TranslationEditor';
import { adminGetCategories, adminGetServices } from '@/lib/admin-data';
import { createCategory, updateCategory, deleteCategory, updateCategoryTranslation } from '../actions';

export default async function CategoriesAdmin() {
  const [categories, services] = await Promise.all([
    adminGetCategories(),
    adminGetServices(),
  ]);

  const countFor = (id: number) => services.filter((s) => s.category_id === id).length;

  return (
    <AdminShell>
      <PageHeading title="Categories" sub="Groups that services are listed under on the site." />

      <Card className="mb-8 p-5">
        <h2 className="mb-4 flex items-center gap-2 font-medium text-ink">
          <Plus size={16} className="text-bmw" /> Add a category
        </h2>
        <form action={createCategory} className="grid gap-4 md:grid-cols-3 md:items-end">
          <Field label="Name">
            <input name="name" required className={aInput} placeholder="Multimedia & Comfort" />
          </Field>
          <Field label="Slug" hint="Leave blank to auto-generate.">
            <input name="slug" className={aInput} placeholder="multimedia" />
          </Field>
          <Field label="Sort order">
            <input name="sort_order" type="number" defaultValue={categories.length + 1} className={aInput} />
          </Field>
          <div>
            <button type="submit" className={aBtn}>
              <Plus size={15} /> Add
            </button>
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        {categories.map((c) => (
          <Card key={c.id} className="p-4">
            <form action={updateCategory} className="grid gap-3 md:grid-cols-12 md:items-end">
              <input type="hidden" name="id" value={c.id} />
              <div className="md:col-span-6">
                <Field label="Name">
                  <input name="name" defaultValue={c.name} className={aInput} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Order">
                  <input name="sort_order" type="number" defaultValue={c.sort_order} className={aInput} />
                </Field>
              </div>
              <div className="md:col-span-2 text-sm text-faint">
                <span className="block text-xs uppercase tracking-wide">Services</span>
                <span className="text-ink">{countFor(c.id)}</span>
              </div>
              <div className="flex justify-end md:col-span-2">
                <button type="submit" className={aBtnGhost}>
                  <Save size={14} /> Save
                </button>
              </div>
            </form>
            <TranslationEditor
              id={c.id}
              translations={c.translations}
              action={updateCategoryTranslation}
              fields={[{ name: 'name', label: 'Name' }]}
            />
            <form action={deleteCategory} className="mt-2 flex justify-end border-t border-white/5 pt-2">
              <input type="hidden" name="id" value={c.id} />
              <ConfirmButton
                className={aBtnDanger}
                message={`Delete "${c.name}"? Its services will become uncategorised.`}
              >
                <Trash2 size={14} /> Delete
              </ConfirmButton>
            </form>
          </Card>
        ))}
        {categories.length === 0 && (
          <p className="text-sm text-muted">No categories yet — add one above.</p>
        )}
      </div>
    </AdminShell>
  );
}
