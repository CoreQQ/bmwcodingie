import { Save } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { PageHeading, Card, Field, aInput, aBtn } from '@/components/admin/ui';
import { TranslationEditor } from '@/components/admin/TranslationEditor';
import { adminGetSettings } from '@/lib/admin-data';
import { updateSettings, updateSettingsTranslation } from '../actions';

export default async function ContentAdmin() {
  const s = await adminGetSettings();

  return (
    <AdminShell>
      <PageHeading
        title="Content & Contacts"
        sub="Edit the hero, the about blurb and every contact detail. Changes appear on the live site immediately."
      />

      <form action={updateSettings} className="space-y-8">
        {/* Hero & copy */}
        <Card className="p-5">
          <h2 className="mb-4 font-medium text-ink">Headline & copy</h2>
          <div className="space-y-4">
            <Field label="Hero title">
              <input name="hero_title" defaultValue={s.hero_title} className={aInput} />
            </Field>
            <Field label="Hero subtitle">
              <textarea name="hero_subtitle" rows={2} defaultValue={s.hero_subtitle} className={aInput} />
            </Field>
            <Field label="About text" hint="Short paragraph about experience, tooling and supported BMW generations.">
              <textarea name="about_text" rows={4} defaultValue={s.about_text} className={aInput} />
            </Field>
            <Field label="Service area" hint="e.g. Dublin city & county, plus Kildare, Wicklow and Meath.">
              <input name="service_area" defaultValue={s.service_area} className={aInput} />
            </Field>
          </div>
        </Card>

        {/* Contacts */}
        <Card className="p-5">
          <h2 className="mb-4 font-medium text-ink">Contacts</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Phone" hint="Shown as a tap-to-call link.">
              <input name="phone" defaultValue={s.phone} className={aInput} placeholder="+353 ..." />
            </Field>
            <Field label="WhatsApp" hint="Digits only, with country code — e.g. 353871234567.">
              <input name="whatsapp" defaultValue={s.whatsapp} className={aInput} placeholder="353871234567" />
            </Field>
            <Field label="Telegram" hint="Username without @, or a full t.me link.">
              <input name="telegram" defaultValue={s.telegram} className={aInput} placeholder="bmwcoding_ie" />
            </Field>
            <Field label="Instagram" hint="Username without @.">
              <input name="instagram" defaultValue={s.instagram} className={aInput} placeholder="bmwcoding.ie" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Email">
                <input name="email" type="email" defaultValue={s.email} className={aInput} placeholder="hello@bmwcoding.ie" />
              </Field>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <button type="submit" className={aBtn}>
            <Save size={15} /> Save changes
          </button>
        </div>
      </form>

      <Card className="mt-8 p-5">
        <p className="mb-4 text-sm text-muted">
          Per-language overrides for the hero subtitle, about text and service area.
        </p>
        <TranslationEditor
          id={1}
          translations={s.translations}
          action={updateSettingsTranslation}
          fields={[
            { name: 'hero_subtitle', label: 'Hero subtitle', multiline: true },
            { name: 'about_text', label: 'About text', multiline: true },
            { name: 'service_area', label: 'Service area', multiline: true },
          ]}
        />
      </Card>
    </AdminShell>
  );
}
