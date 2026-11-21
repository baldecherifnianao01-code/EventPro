export type UserRole = 'client' | 'admin' | 'manager';
export type LanguageCode = 'fr' | 'ar' | 'en';

export type BookingStatus =
  | 'nouvelle_demande'
  | 'en_attente_confirmation'
  | 'devis_envoye'
  | 'devis_accepte'
  | 'reservation_confirmee'
  | 'evenement_termine'
  | 'annulee';

export type QuoteStatus = 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire';
export type PaymentMethod = 'carte_bancaire' | 'virement_bancaire' | 'sur_place';
export type PaymentType = 'acompte' | 'solde' | 'total';
export type PaymentStatus =
  | 'en_attente'
  | 'en_verification'
  | 'autorise_test'
  | 'valide'
  | 'echoue'
  | 'rembourse';
export type InvoiceStatus = 'emise' | 'partielle' | 'payee' | 'annulee';
export type GalleryCategory =
  | 'mariages'
  | 'anniversaires'
  | 'conferences'
  | 'decorations'
  | 'soirees'
  | 'concerts'
  | 'entreprise';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface Profile {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  city: string;
  company: string;
  preferredLanguage: LanguageCode;
  cndpConsentAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  slug: string;
  group: 'private' | 'corporate' | 'festive' | 'complementary';
  nameFr: string;
  nameAr: string;
  nameEn: string;
  descriptionFr: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrl: string;
  subtypes: string[];
  sortOrder: number;
}

export interface ServiceItem {
  id: string;
  categoryId: string;
  slug: string;
  titleFr: string;
  titleAr: string;
  titleEn: string;
  descriptionFr: string;
  descriptionAr: string;
  descriptionEn: string;
  unitPriceMad: number;
  unitLabel: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  userId: string | null;
  fullName: string;
  email: string;
  phone: string;
  eventCategory: string;
  eventType: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  city: string;
  guestCount: number;
  budgetMad: number;
  description: string;
  attachmentName: string | null;
  attachmentDataUrl: string | null;
  status: BookingStatus;
  assignedManager: string | null;
  internalNotes: string;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookingService {
  id: string;
  bookingId: string;
  serviceId: string;
  serviceTitle: string;
  quantity: number;
  unitPriceMad: number;
}

export interface EventItem {
  id: string;
  titleFr: string;
  titleAr: string;
  titleEn: string;
  category: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  city: string;
  capacity: number;
  registeredCount: number;
  descriptionFr: string;
  imageUrl: string;
  status: 'planifie' | 'en_cours' | 'termine';
  isShowcaseDemo: boolean;
  createdAt: string;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  bookingId: string;
  userId: string | null;
  clientName: string;
  clientEmail: string;
  subtotalMad: number;
  discountMad: number;
  vatRatePercent: number;
  vatAmountMad: number;
  totalTtcMad: number;
  paymentTerms: string;
  validUntil: string;
  notes: string;
  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteItem {
  id: string;
  quoteId: string;
  serviceId: string | null;
  description: string;
  quantity: number;
  unitPriceMad: number;
  totalMad: number;
}

export interface Payment {
  id: string;
  transactionRef: string;
  quoteId: string;
  bookingId: string;
  userId: string | null;
  paymentType: PaymentType;
  method: PaymentMethod;
  amountMad: number;
  status: PaymentStatus;
  gatewayMode: 'test' | 'live';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  quoteId: string;
  bookingId: string;
  userId: string | null;
  clientName: string;
  clientEmail: string;
  subtotalMad: number;
  discountMad: number;
  vatRatePercent: number;
  vatAmountMad: number;
  totalTtcMad: number;
  paidAmountMad: number;
  status: InvoiceStatus;
  issuedAt: string;
}

export interface GalleryItem {
  id: string;
  titleFr: string;
  titleAr: string;
  titleEn: string;
  category: GalleryCategory;
  mediaType: 'photo' | 'video';
  mediaUrl: string;
  thumbnailUrl: string;
  captionFr: string;
  isDemoVisual: boolean;
  createdAt: string;
}

export interface Testimonial {
  id: string;
  authorName: string;
  authorRole: string;
  companyOrCity: string;
  eventType: string;
  quoteFr: string;
  quoteAr: string;
  quoteEn: string;
  isPublished: boolean;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string | null;
  targetRole: 'client' | 'admin';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'nouveau' | 'traite';
  createdAt: string;
}

export interface AdminStatEntry {
  key: 'events' | 'clients' | 'partners' | 'bookings';
  labelFr: string;
  labelAr: string;
  labelEn: string;
  value: string;
  unitOrContext: string;
}

export interface SiteSettings {
  companyName: string;
  sloganFr: string;
  sloganAr: string;
  sloganEn: string;
  address: string;
  phone: string;
  email: string;
  currency: 'MAD';
  defaultLanguage: LanguageCode;
  vatRatePercent: number;
  vatLabel: string;
  allowOnSitePayment: boolean;
  bankRib: string;
  bankName: string;
  blockedDates: string[];
  maxBookingsPerDay: number;
  cancellationNoticeDays: number;
  heroTitleFr: string;
  heroSubtitleFr: string;
  ctaTitleFr: string;
  socialLinks: {
    instagram: string;
    linkedin: string;
    facebook: string;
    youtube: string;
  };
  stats: AdminStatEntry[];
  emailNotificationsEnabled: boolean;
  paymentGatewayMode: 'test' | 'live';
  smtpConfigured: boolean;
  updatedAt: string;
}

export interface PublicBootstrap {
  categories: Category[];
  services: ServiceItem[];
  events: EventItem[];
  gallery: GalleryItem[];
  testimonials: Testimonial[];
  settings: SiteSettings;
}

export interface BookingPreselection {
  category?: string;
  eventType?: string;
  serviceIds?: string[];
  budgetMad?: number;
  offerTitle?: string;
  offerPriceSummary?: string;
}

