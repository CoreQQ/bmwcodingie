export type Category = {
  id: number;
  slug: string;
  name: string;
  sort_order: number;
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
};

export type GalleryItem = {
  id: number;
  image_url: string;
  caption: string;
  visible: boolean;
  sort_order: number;
};

export type Booking = {
  id: number;
  name: string;
  contact: string;
  bmw_model: string;
  service: string;
  message: string;
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
};

export type CategoryWithServices = Category & { services: Service[] };
