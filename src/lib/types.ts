export type CategoryTranslation = { name?: string };
export type ServiceTranslation = { title?: string; description?: string; price_label?: string };
export type SiteSettingsTranslation = { hero_subtitle?: string; about_text?: string; service_area?: string };

export type Category = {
  id: number;
  slug: string;
  name: string;
  sort_order: number;
  translations: Record<string, CategoryTranslation>;
};

export type Service = {
  id: number;
  category_id: number | null;
  title: string;
  description: string;
  price_label: string;
  mobile_available: boolean;
  visible: boolean;
  sort_order: number;
  translations: Record<string, ServiceTranslation>;
};

export type GalleryItem = {
  id: number;
  image_url: string;
  caption: string;
  visible: boolean;
  sort_order: number;
};

export type BookingStatus = 'pending' | 'confirmed' | 'declined' | 'cancelled';

export type Booking = {
  id: number;
  name: string;
  contact: string;
  bmw_model: string;
  service: string;
  message: string;
  slot_date: string | null;
  slot_time: string;
  status: BookingStatus;
  handled: boolean;
  created_at: string;
};

export type SiteSettings = {
  hero_title: string;
  hero_subtitle: string;
  about_text: string;
  service_area: string;
  phone: string;
  whatsapp: string;
  telegram: string;
  instagram: string;
  email: string;
  translations: Record<string, SiteSettingsTranslation>;
};

export type CategoryWithServices = Category & { services: Service[] };

export type CarModel = {
  id: number;
  chassis_code: string;
  label: string;
  year_from: number;
  year_to: number | null;
  sort_order: number;
};

export type CompatibilityStatus = 'yes' | 'no' | 'on_request';

export type ModelCompatibility = {
  id: number;
  model_id: number;
  service_id: number;
  status: CompatibilityStatus;
  note: string;
};
