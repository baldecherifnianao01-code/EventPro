import { ArrowRight, Check, Tag } from 'lucide-react';
import { useI18n } from '../i18n.tsx';
import type { BookingPreselection } from '../types.ts';
import type { AppRoute } from './Navbar.tsx';
import { ResilientImage } from './ResilientImage.tsx';

export interface ExclusiveOffer {
  id: string;
  titleFr: string;
  titleAr: string;
  titleEn: string;
  kickerFr: string;
  kickerAr: string;
  kickerEn: string;
  discountPercent: number;
  category: string;
  eventType: string;
  oldPriceMad: number;
  newPriceMad: number;
  unitLabelFr: string;
  unitLabelAr: string;
  unitLabelEn: string;
  validUntilFr: string;
  descriptionFr: string;
  descriptionAr: string;
  descriptionEn: string;
  includedFr: string[];
  imageUrl: string;
  serviceIds: string[];
}

export const EXCLUSIVE_OFFERS: ExclusiveOffer[] = [
  {
    id: 'offer_wedding_prestige',
    titleFr: 'Pack Mariage Prestige — Clé en Main',
    titleAr: 'باقة الزفاف الفاخرة — تنظيم متكامل',
    titleEn: 'Prestige Wedding Package — Turnkey',
    kickerFr: 'Offre Saison',
    kickerAr: 'عرض الموسم',
    kickerEn: 'Seasonal Offer',
    discountPercent: 18,
    category: 'Événements Privés',
    eventType: 'Mariages',
    oldPriceMad: 39500,
    newPriceMad: 32500,
    unitLabelFr: 'Forfait complet',
    unitLabelAr: 'باقة شاملة',
    unitLabelEn: 'Complete package',
    validUntilFr: 'Valable sur les réservations Casablanca & environs',
    descriptionFr:
      'Une direction artistique complète réunissant décoration florale, capture cinéma et mise en scène musicale pour votre réception.',
    descriptionAr:
      'إدارة فنية متكاملة تجمع بين الديكور بالزهور والتصوير السينمائي والتنشيط الموسيقي لحفلكم.',
    descriptionEn:
      'Complete creative production combining floral architecture, cinema filming, and curated live entertainment.',
    includedFr: [
      'Scénographie florale & arche d’honneur sur mesure',
      'Couverture photo & film cinéma multi-caméras',
      'Sonorisation, éclairage architectural & DJ résident',
      'Coordination complète le jour J par un chef de projet',
    ],
    imageUrl: '/src/assets/images/category_private_wedding_1795276849180.jpg',
    serviceIds: ['srv_decor', 'srv_photo_video', 'srv_dj_animation'],
  },
  {
    id: 'offer_corporate_summit',
    titleFr: 'Forfait Séminaire & Conférence Exécutive',
    titleAr: 'باقة الندوات والمؤتمرات المهنية',
    titleEn: 'Executive Seminar & Conference Pack',
    kickerFr: 'Offre Entreprise',
    kickerAr: 'عرض الشركات',
    kickerEn: 'Corporate Offer',
    discountPercent: 17,
    category: 'Événements Professionnels',
    eventType: 'Conférences',
    oldPriceMad: 42000,
    newPriceMad: 34900,
    unitLabelFr: 'Forfait journée',
    unitLabelAr: 'باقة يوم كامل',
    unitLabelEn: 'Full-day package',
    validUntilFr: 'Réservation anticipée · Casablanca Finance City & Anfa',
    descriptionFr:
      'L’infrastructure technique et protocolaire indispensable pour réussir vos conventions, lancements de produits et assemblées.',
    descriptionAr:
      'البنية التقنية والبروتوكولية المتكاملة لإنجاح مؤتمراتكم وإطلاق منتجاتكم بالدار البيضاء.',
    descriptionEn:
      'Full technical production and executive hospitality tailored for corporate summits and brand launches.',
    includedFr: [
      'Privatisation salle équipée Finance City / Anfa',
      'Régie son line-array, mur LED & éclairage scénique',
      '2 hôtesses bilingues d’accueil & émargement digital',
      'Coordination logistique et régisseur dédié sur place',
    ],
    imageUrl: '/src/assets/images/venue_auditorium_finance_1795278113298.jpg',
    serviceIds: ['srv_venue', 'srv_sound_light', 'srv_hostesses'],
  },
  {
    id: 'offer_gala_soiree',
    titleFr: 'Pack Soirée Gala, Décor & Animation',
    titleAr: 'باقة سهرة الغالا والديكور والتنشيط',
    titleEn: 'Gala Night, Decor & Live Set Pack',
    kickerFr: 'Offre Privilège',
    kickerAr: 'عرض حصري',
    kickerEn: 'Privilege Offer',
    discountPercent: 19,
    category: 'Événements Festifs & Culturels',
    eventType: 'Galas',
    oldPriceMad: 32000,
    newPriceMad: 25800,
    unitLabelFr: 'Par soirée',
    unitLabelAr: 'لكل سهرة',
    unitLabelEn: 'Per evening',
    validUntilFr: 'Édition limitée · Printemps – Été',
    descriptionFr:
      'Transformez votre lieu de réception avec un mobilier design, des arts de la table noir et or et une ambiance musicale sur mesure.',
    descriptionAr:
      'حوّلوا فضاء الحفل بأثاث عصري وتنسيق مائدة بالأسود والذهبي مع أجواء موسيقية راقية.',
    descriptionEn:
      'Transform any reception venue with designer lounge furniture, black-and-gold table styling, and live music.',
    includedFr: [
      'Décoration noir & or et centres de table sculpturaux',
      'Location de mobilier design & salons lounge',
      'Sonorisation, éclairage DMX & DJ ou ensemble live',
      'Montage, régie soirée et démontage inclus',
    ],
    imageUrl: '/src/assets/images/gallery_gala_dinner_1795276848851.jpg',
    serviceIds: ['srv_decor', 'srv_sound_light', 'srv_dj_animation', 'srv_furniture'],
  },
];

function formatDh(amount: number): string {
  return `${new Intl.NumberFormat('fr-MA').format(amount)} DH`;
}

interface ExclusiveOffersSectionProps {
  onNavigate: (route: AppRoute, preselection?: string | BookingPreselection) => void;
}

export function ExclusiveOffersSection({ onNavigate }: ExclusiveOffersSectionProps) {
  const { lang } = useI18n();

  const headingTitle =
    lang === 'ar'
      ? 'عروض حصرية — باقات ترويجية بالدرهم'
      : lang === 'en'
        ? 'Exclusive Offers — Seasonal Event Packages'
        : 'Exclusive Offers — Offres Privilèges & Tarifs Promotionnels';

  const headingSubtitle =
    lang === 'ar'
      ? 'استفيدوا من تخفيضات مدروسة على باقاتنا الجاهزة مع عرض واضح للسعر الأصلي والسعر الترويجي بالدرهم المغربي.'
      : lang === 'en'
        ? 'Take advantage of curated seasonal reductions on turnkey event packages with transparent old and new pricing in MAD (DH).'
        : 'Profitez de tarifs préférentiels sur nos forfaits clés en main, avec comparaison transparente entre tarif catalogue et tarif promotionnel en DH.';

  const handleSelectOffer = (offer: ExclusiveOffer) => {
    const title = lang === 'ar' ? offer.titleAr : lang === 'en' ? offer.titleEn : offer.titleFr;
    onNavigate('/reserver', {
      category: offer.category,
      eventType: offer.eventType,
      serviceIds: offer.serviceIds,
      budgetMad: offer.newPriceMad,
      offerTitle: title,
      offerPriceSummary: `${formatDh(offer.newPriceMad)} au lieu de ${formatDh(offer.oldPriceMad)} (-${offer.discountPercent}%)`,
    });
  };

  return (
    <section className="py-24 bg-white border-t border-[#E5E5E0]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#A8821B]">
              <Tag className="w-3.5 h-3.5" />
              <span>Exclusive Offers · Casablanca &amp; Maroc</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-semibold leading-[1.12] tracking-tight text-[#0A0A0B] [text-wrap:balance]">
              {headingTitle}
            </h2>
            <p className="text-sm sm:text-base text-[#52525B] leading-relaxed">
              {headingSubtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('/reserver')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0A0A0B] hover:text-[#A8821B] transition-colors whitespace-nowrap shrink-0"
          >
            <span>Composer un forfait personnalisé</span>
            <ArrowRight className="w-4 h-4 text-[#C59B27]" />
          </button>
        </div>

        {/* 3-Column Promotional Offer Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {EXCLUSIVE_OFFERS.map((offer) => {
            const savings = offer.oldPriceMad - offer.newPriceMad;
            const title =
              lang === 'ar' ? offer.titleAr : lang === 'en' ? offer.titleEn : offer.titleFr;
            const kicker =
              lang === 'ar' ? offer.kickerAr : lang === 'en' ? offer.kickerEn : offer.kickerFr;
            const desc =
              lang === 'ar'
                ? offer.descriptionAr
                : lang === 'en'
                  ? offer.descriptionEn
                  : offer.descriptionFr;
            const unitLabel =
              lang === 'ar'
                ? offer.unitLabelAr
                : lang === 'en'
                  ? offer.unitLabelEn
                  : offer.unitLabelFr;

            return (
              <article
                key={offer.id}
                className="group border border-[#E5E5E0] hover:border-[#C59B27] rounded-lg overflow-hidden bg-white flex flex-col justify-between transition-colors duration-300"
              >
                <div>
                  {/* Clean uninterrupted 16:10 photography */}
                  <div className="aspect-[16/10] bg-[#141417] overflow-hidden">
                    <ResilientImage
                      src={offer.imageUrl}
                      alt={title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  </div>

                  <div className="p-6 sm:p-7 space-y-5">
                    {/* Unboxed kicker metadata */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-[#A8821B]">
                      <span className="uppercase tracking-[0.14em]">{kicker}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono font-semibold tabular-nums">
                        -{offer.discountPercent}%
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#6B6B73]">{offer.category}</span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-display text-2xl font-semibold text-[#0A0A0B] leading-snug">
                        {title}
                      </h3>
                      <p className="text-sm text-[#4A4A52] leading-relaxed">{desc}</p>
                    </div>

                    {/* Pricing block: Old price + New promotional price in DH */}
                    <div className="py-4 border-y border-[#E5E5E0] space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs text-[#6B6B73]">
                        <span>Tarif catalogue</span>
                        <span className="line-through font-mono tabular-nums text-sm">
                          {formatDh(offer.oldPriceMad)}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-xs font-medium text-[#0A0A0B]">
                          Nouveau prix ({unitLabel})
                        </span>
                        <span className="font-display text-3xl font-semibold text-[#0A0A0B] tabular-nums tracking-tight">
                          {formatDh(offer.newPriceMad)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-[#6B6B73]">{offer.validUntilFr}</span>
                        <span className="font-semibold text-[#A8821B] tabular-nums whitespace-nowrap">
                          Économie : {formatDh(savings)}
                        </span>
                      </div>
                    </div>

                    {/* Included deliverables */}
                    <ul className="space-y-2">
                      {offer.includedFr.map((line) => (
                        <li
                          key={line}
                          className="flex items-start gap-2.5 text-xs sm:text-[13px] text-[#4A4A52] leading-snug"
                        >
                          <Check className="w-3.5 h-3.5 text-[#C59B27] shrink-0 mt-0.5" />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Action footer */}
                <div className="px-6 sm:px-7 pb-6 sm:pb-7 pt-2">
                  <button
                    type="button"
                    onClick={() => handleSelectOffer(offer)}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold bg-[#0A0A0B] text-white hover:bg-[#C59B27] hover:text-[#0A0A0B] transition-colors rounded-md"
                  >
                    <span>
                      {lang === 'ar'
                        ? 'الاستفادة من هذا العرض'
                        : lang === 'en'
                          ? 'Claim This Offer'
                          : 'Profiter de cette offre'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
