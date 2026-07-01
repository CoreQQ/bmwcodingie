import { Trash2, Plus, Save, Star } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { PageHeading, Card, Field, aInput, aBtn, aBtnGhost, aBtnDanger } from '@/components/admin/ui';
import { ConfirmButton } from '@/components/admin/ConfirmButton';
import { adminGetReviews } from '@/lib/admin-data';
import { createReview, updateReview, deleteReview } from '../actions';
import type { Review } from '@/lib/types';

export default async function ReviewsAdmin() {
  const reviews = await adminGetReviews();

  return (
    <AdminShell>
      <PageHeading
        title="Reviews"
        sub="Customer reviews shown on the site. These also power the star rating in Google — only add genuine reviews."
      />

      <Card className="mb-8 p-5">
        <h2 className="mb-4 flex items-center gap-2 font-medium text-ink">
          <Plus size={16} className="text-bmw" /> Add a review
        </h2>
        <form action={createReview} className="grid gap-4 md:grid-cols-12 md:items-end">
          <div className="md:col-span-4">
            <Field label="Author">
              <input name="author" required className={aInput} placeholder="John M." />
            </Field>
          </div>
          <div className="md:col-span-4">
            <Field label="Car (optional)">
              <input name="car" className={aInput} placeholder="G30 530e · CarPlay" />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Rating">
              <select name="rating" defaultValue="5" className={aInput}>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n} className="bg-graphite-800">
                    {n} ★
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Order">
              <input name="sort_order" type="number" defaultValue={reviews.length + 1} className={aInput} />
            </Field>
          </div>
          <div className="md:col-span-10">
            <Field label="Review">
              <textarea name="body" required rows={2} className={aInput} placeholder="What they said…" />
            </Field>
          </div>
          <div className="md:col-span-2">
            <button type="submit" className={aBtn}>
              <Plus size={15} /> Add
            </button>
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        {reviews.map((r) => (
          <ReviewRow key={r.id} review={r} />
        ))}
        {reviews.length === 0 && (
          <p className="text-sm text-muted">No reviews yet — add your first one above.</p>
        )}
      </div>
    </AdminShell>
  );
}

function ReviewRow({ review: r }: { review: Review }) {
  return (
    <Card className={`p-4 ${r.visible ? '' : 'opacity-60'}`}>
      <form action={updateReview} className="grid gap-3 md:grid-cols-12 md:items-end">
        <input type="hidden" name="id" value={r.id} />
        <div className="md:col-span-3">
          <Field label="Author">
            <input name="author" defaultValue={r.author} className={aInput} />
          </Field>
        </div>
        <div className="md:col-span-3">
          <Field label="Car">
            <input name="car" defaultValue={r.car} className={aInput} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Rating">
            <select name="rating" defaultValue={String(r.rating)} className={aInput}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n} className="bg-graphite-800">
                  {n} ★
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Order">
            <input name="sort_order" type="number" defaultValue={r.sort_order} className={aInput} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted md:col-span-2">
          <input type="checkbox" name="visible" defaultChecked={r.visible} className="accent-bmw" />
          Visible
        </label>
        <div className="md:col-span-11">
          <Field label="Review">
            <textarea name="body" defaultValue={r.body} rows={2} className={aInput} />
          </Field>
        </div>
        <div className="flex justify-end md:col-span-1">
          <button type="submit" className={aBtnGhost}>
            <Save size={14} /> Save
          </button>
        </div>
      </form>
      <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-2">
        <span className="flex items-center gap-0.5 text-bmw">
          {Array.from({ length: r.rating }).map((_, i) => (
            <Star key={i} size={13} className="fill-bmw" />
          ))}
        </span>
        <form action={deleteReview}>
          <input type="hidden" name="id" value={r.id} />
          <ConfirmButton className={aBtnDanger} message={`Delete the review from ${r.author}?`}>
            <Trash2 size={14} /> Delete
          </ConfirmButton>
        </form>
      </div>
    </Card>
  );
}
