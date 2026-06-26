'use client';

import { useState } from 'react';
import { Languages, Save } from 'lucide-react';
import { Field, aInput, aBtnGhost } from './ui';

const LOCALE_LABELS: Record<string, string> = {
  ru: 'Русский',
  uk: 'Українська',
  pl: 'Polski',
  lt: 'Lietuvių',
  ro: 'Română',
};

const LOCALES = Object.keys(LOCALE_LABELS);

type FieldDef = { name: string; label: string; multiline?: boolean };

export function TranslationEditor({
  id,
  translations,
  fields,
  action,
}: {
  id: number;
  translations: Record<string, Record<string, string>> | undefined;
  fields: FieldDef[];
  action: (formData: FormData) => void;
}) {
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState(LOCALES[0]);
  const current = translations?.[locale] ?? {};

  return (
    <div className="mt-2 border-t border-white/5 pt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-faint transition-colors hover:text-muted"
      >
        <Languages size={13} /> Translations
      </button>
      {open && (
        <form action={action} key={locale} className="mt-3 grid gap-3">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="locale" value={locale} />
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className={`${aInput} max-w-[10rem]`}
          >
            {LOCALES.map((l) => (
              <option key={l} value={l} className="bg-graphite-800">
                {LOCALE_LABELS[l]}
              </option>
            ))}
          </select>
          {fields.map((f) =>
            f.multiline ? (
              <Field key={f.name} label={f.label}>
                <textarea name={f.name} rows={2} defaultValue={current[f.name] ?? ''} className={aInput} />
              </Field>
            ) : (
              <Field key={f.name} label={f.label}>
                <input name={f.name} defaultValue={current[f.name] ?? ''} className={aInput} />
              </Field>
            ),
          )}
          <div className="flex justify-end">
            <button type="submit" className={aBtnGhost}>
              <Save size={14} /> Save translation
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
