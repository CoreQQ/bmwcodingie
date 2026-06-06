import { Upload, Save, Trash2, ImageOff } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { PageHeading, Card, Field, aInput, aBtn, aBtnGhost, aBtnDanger } from '@/components/admin/ui';
import { ConfirmButton } from '@/components/admin/ConfirmButton';
import { adminGetGallery } from '@/lib/admin-data';
import { uploadGalleryImage, updateGalleryItem, deleteGalleryItem } from '../actions';
import type { GalleryItem } from '@/lib/types';

export default async function GalleryAdmin() {
  const items = await adminGetGallery();

  return (
    <AdminShell>
      <PageHeading
        title="Gallery"
        sub="Upload before/after shots, iDrive screens and process photos. Hidden photos stay off the live site."
      />

      {/* Upload */}
      <Card className="mb-8 p-5">
        <h2 className="mb-4 flex items-center gap-2 font-medium text-ink">
          <Upload size={16} className="text-bmw" /> Upload a photo
        </h2>
        <form action={uploadGalleryImage} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Image file" hint="JPG, PNG or WebP from your phone or computer.">
              <input
                name="file"
                type="file"
                accept="image/*"
                required
                className="block w-full text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-bmw file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-bmw-dark"
              />
            </Field>
          </div>
          <Field label="Caption">
            <input name="caption" className={aInput} placeholder="G30 ambient retrofit — Dublin" />
          </Field>
          <Field label="Sort order">
            <input name="sort_order" type="number" defaultValue={0} className={aInput} />
          </Field>
          <div className="flex items-end md:col-span-2">
            <button type="submit" className={aBtn}>
              <Upload size={15} /> Upload photo
            </button>
          </div>
        </form>
      </Card>

      {/* Existing items */}
      {items.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <ImageOff size={28} className="text-faint" />
          <p className="text-sm text-muted">
            No photos yet. Upload your first work shot above — it appears in the gallery instantly.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <GalleryEditor key={item.id} item={item} />
          ))}
        </div>
      )}
    </AdminShell>
  );
}

function GalleryEditor({ item }: { item: GalleryItem }) {
  return (
    <Card className={`overflow-hidden ${item.visible ? '' : 'opacity-60'}`}>
      <div className="relative aspect-[4/3] w-full bg-graphite-900">
        {/* Arbitrary Supabase URLs — plain img is the robust choice here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.image_url} alt={item.caption || 'Gallery photo'} className="h-full w-full object-cover" />
        {!item.visible && (
          <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-xs uppercase tracking-wide text-muted">
            Hidden
          </span>
        )}
      </div>

      <div className="p-4">
        <form action={updateGalleryItem} className="space-y-3">
          <input type="hidden" name="id" value={item.id} />
          <Field label="Caption">
            <input name="caption" defaultValue={item.caption} className={aInput} />
          </Field>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Field label="Order">
                <input name="sort_order" type="number" defaultValue={item.sort_order} className={aInput} />
              </Field>
            </div>
            <label className="flex items-center gap-2 pb-2 text-sm text-muted">
              <input type="checkbox" name="visible" defaultChecked={item.visible} className="accent-bmw" />
              Visible
            </label>
          </div>
          <button type="submit" className={`${aBtnGhost} w-full`}>
            <Save size={14} /> Save
          </button>
        </form>

        <form action={deleteGalleryItem} className="mt-2 border-t border-white/5 pt-2">
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="image_url" value={item.image_url} />
          <ConfirmButton className={`${aBtnDanger} w-full`} message="Delete this photo? This cannot be undone.">
            <Trash2 size={14} /> Delete
          </ConfirmButton>
        </form>
      </div>
    </Card>
  );
}
