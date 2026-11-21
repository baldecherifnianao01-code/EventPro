import React, { createContext, useContext, useEffect, useState } from 'react';
import type { LanguageCode } from './types.ts';

interface Dictionary {
  nav: {
    home: string;
    events: string;
    services: string;
    gallery: string;
    about: string;
    contact: string;
    bookNow: string;
    clientPortal: string;
  };
  hero: {
    locationTag: string;
    primaryCta: string;
    secondaryCta: string;
  };
  sections: {
    categoriesTitle: string;
    categoriesSubtitle: string;
    discoverBtn: string;
    whyTitle: string;
    whySubtitle: string;
    recentEventsTitle: string;
    recentEventsSubtitle: string;
    testimonialsTitle: string;
    statsTitle: string;
    ctaButton: string;
  };
  booking: {
    title: string;
    subtitle: string;
    submitBtn: string;
  };
  statusLabels: Record<string, string>;
}

const DICTIONARIES: Record<LanguageCode, Dictionary> = {
  fr: {
    nav: {
      home: 'Accueil',
      events: 'Nos événements',
      services: 'Nos services',
      gallery: 'Galerie',
      about: 'À propos',
      contact: 'Contact',
      bookNow: 'Réserver maintenant',
      clientPortal: 'Espace client',
    },
    hero: {
      locationTag: 'Casablanca & Maroc · Organisation Événementielle',
      primaryCta: 'Organiser mon événement',
      secondaryCta: 'Découvrir nos services',
    },
    sections: {
      categoriesTitle: "Nos Univers d'Événements",
      categoriesSubtitle:
        'De la réception familiale intime aux congrès internationaux, une direction artistique et technique complète.',
      discoverBtn: 'Découvrir',
      whyTitle: 'Pourquoi choisir EVENT PRO ?',
      whySubtitle:
        'Une méthodologie éprouvée au service de votre sérénité, à Casablanca et partout au Maroc.',
      recentEventsTitle: 'Formats & Conceptions Récentes',
      recentEventsSubtitle:
        'Exemples de scénographies et dispositifs événementiels déployables selon votre cahier des charges.',
      testimonialsTitle: 'Retours & Appréciations',
      statsTitle: 'Repères & Chiffres Clés',
      ctaButton: 'Démarrer votre projet',
    },
    booking: {
      title: 'Réserver & Demander un Devis',
      subtitle:
        'Précisez votre date, vos besoins et votre budget en Dirhams marocains (MAD). Notre équipe étudie la disponibilité en temps réel.',
      submitBtn: 'Envoyer ma demande de réservation',
    },
    statusLabels: {
      nouvelle_demande: 'Nouvelle demande',
      en_attente_confirmation: 'En attente de confirmation',
      devis_envoye: 'Devis envoyé',
      devis_accepte: 'Devis accepté',
      reservation_confirmee: 'Réservation confirmée',
      evenement_termine: 'Événement terminé',
      annulee: 'Annulée',
    },
  },
  ar: {
    nav: {
      home: 'الرئيسية',
      events: 'الفعاليات',
      services: 'خدماتنا',
      gallery: 'المعرض',
      about: 'من نحن',
      contact: 'اتصل بنا',
      bookNow: 'احجز الآن',
      clientPortal: 'فضاء العميل',
    },
    hero: {
      locationTag: 'الدار البيضاء والمغرب · تنظيم الفعاليات',
      primaryCta: 'تنظيم فعاليتي',
      secondaryCta: 'اكتشاف خدماتنا',
    },
    sections: {
      categoriesTitle: 'أنواع الفعاليات التي ننظمها',
      categoriesSubtitle:
        'من الحفلات العائلية الخاصة إلى المؤتمرات المهنية الكبرى بإشراف هندسي وفني متكامل.',
      discoverBtn: 'اكتشف المزيد',
      whyTitle: 'لماذا تختار EVENT PRO؟',
      whySubtitle: 'منهجية احترافية ومواكبة شاملة لنجاح مناسباتكم في الدار البيضاء والمغرب.',
      recentEventsTitle: 'نماذج وتصاميم حديثة',
      recentEventsSubtitle: 'أمثلة حية لسينوغرافيا وتجهيزات الفعاليات القابلة للتخصيص حسب طلبكم.',
      testimonialsTitle: 'آراء العملاء',
      statsTitle: 'مؤشرات وأرقام رئيسية',
      ctaButton: 'ابدأ مشروعك الآن',
    },
    booking: {
      title: 'طلب حجز وعرض سعر',
      subtitle: 'حدد التاريخ والخدمات والميزانية بالدرهم المغربي مع التحقق الفوري من التوفر.',
      submitBtn: 'إرسال طلب الحجز',
    },
    statusLabels: {
      nouvelle_demande: 'طلب جديد',
      en_attente_confirmation: 'في انتظار التأكيد',
      devis_envoye: 'تم إرسال عرض السعر',
      devis_accepte: 'تم قبول عرض السعر',
      reservation_confirmee: 'حجز مؤكد',
      evenement_termine: 'فعالية منتهية',
      annulee: 'ملغاة',
    },
  },
  en: {
    nav: {
      home: 'Home',
      events: 'Events',
      services: 'Services',
      gallery: 'Gallery',
      about: 'About',
      contact: 'Contact',
      bookNow: 'Book Now',
      clientPortal: 'Client Portal',
    },
    hero: {
      locationTag: 'Casablanca & Morocco · Event Production',
      primaryCta: 'Plan My Event',
      secondaryCta: 'Explore Services',
    },
    sections: {
      categoriesTitle: 'Event Categories',
      categoriesSubtitle:
        'From intimate private celebrations to large-scale corporate summits across Casablanca and Morocco.',
      discoverBtn: 'Discover',
      whyTitle: 'Why Choose EVENT PRO?',
      whySubtitle:
        'Structured project management, vetted Moroccan partners, and end-to-end execution.',
      recentEventsTitle: 'Recent Concepts & Formats',
      recentEventsSubtitle:
        'Showcase event architectures tailored to your venue, guest count, and budget.',
      testimonialsTitle: 'Client Feedback',
      statsTitle: 'Key Figures',
      ctaButton: 'Start Your Project',
    },
    booking: {
      title: 'Book & Request a Quote',
      subtitle:
        'Select your preferred date, venue, and budget in Moroccan Dirhams (MAD) with live slot validation.',
      submitBtn: 'Submit Booking Request',
    },
    statusLabels: {
      nouvelle_demande: 'New Request',
      en_attente_confirmation: 'Awaiting Confirmation',
      devis_envoye: 'Quote Sent',
      devis_accepte: 'Quote Accepted',
      reservation_confirmee: 'Booking Confirmed',
      evenement_termine: 'Completed',
      annulee: 'Cancelled',
    },
  },
};

interface I18nContextValue {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  t: Dictionary;
  isRtl: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<LanguageCode>('fr');
  const isRtl = lang === 'ar';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [lang, isRtl]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t: DICTIONARIES[lang], isRtl }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}

export function formatMad(amount: number): string {
  return `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 2 }).format(amount)} DH`;
}
