import { ArrowRight, Calendar, MapPin, Users } from 'lucide-react';
import { useI18n } from '../i18n.tsx';
import type {
  BookingPreselection,
  Category,
  EventItem,
  GalleryItem,
  SiteSettings,
  Testimonial,
} from '../types.ts';
import type { AppRoute } from './Navbar.tsx';
import { ResilientImage } from './ResilientImage.tsx';
import { PremiumStatsSection } from './PremiumStatsSection.tsx';
import { MasonryGallerySection } from './MasonryGallerySection.tsx';
import { VenuesCarouselSection } from './VenuesCarouselSection.tsx';
import { ExploreByExperienceSection } from './ExploreByExperienceSection.tsx';
import { ExclusiveOffersSection } from './ExclusiveOffersSection.tsx';
import { ClientLoveStoriesSection } from './ClientLoveStoriesSection.tsx';
import { EventTimelineSection } from './EventTimelineSection.tsx';
import { BeforeAfterGallerySection } from './BeforeAfterGallerySection.tsx';
import { DiscoverCasablancaSection } from './DiscoverCasablancaSection.tsx';

interface HomePageProps {
  categories: Category[];
  events: EventItem[];
  gallery: GalleryItem[];
  testimonials: Testimonial[];
  settings: SiteSettings;
  onNavigate: (route: AppRoute, preselection?: string | BookingPreselection) => void;
}

const WHY_ITEMS = [
  {
    num: '01.',
    title: 'Accompagnement personnalisé',
    desc: 'Un interlocuteur unique dédié à votre projet du premier rendez-vous jusqu’au démontage final.',
  },
  {
    num: '02.',
    title: 'Équipe professionnelle',
    desc: 'Chefs de projet, régisseurs techniques et hôtesses protocolaires formés aux standards internationaux.',
  },
  {
    num: '03.',
    title: 'Prestataires de qualité',
    desc: 'Un réseau sélectionné de traiteurs, décorateurs floraux, lieux d’exception et artistes au Maroc.',
  },
  {
    num: '04.',
    title: 'Organisation sur mesure',
    desc: 'Chaque scénographie, menu et planning est conçu spécifiquement selon votre identité et vos invités.',
  },
  {
    num: '05.',
    title: 'Respect du budget',
    desc: 'Devis détaillés en Dirhams marocains (MAD), suivi transparent des acomptes et maîtrise des coûts.',
  },
  {
    num: '06.',
    title: 'Suivi de A à Z',
    desc: 'Espace client sécurisé pour consulter vos devis, valider vos étapes et télécharger vos factures.',
  },
];

export function HomePage({
  categories,
  events,
  gallery,
  testimonials,
  settings,
  onNavigate,
}: HomePageProps) {
  const { lang, t } = useI18n();

  const getCategoryTitle = (cat: Category) =>
    lang === 'ar' ? cat.nameAr : lang === 'en' ? cat.nameEn : cat.nameFr;
  const getCategoryDesc = (cat: Category) =>
    lang === 'ar' ? cat.descriptionAr : lang === 'en' ? cat.descriptionEn : cat.descriptionFr;

  return (
    <div>
      {/* 1. Hero Section */}
      <section className="relative bg-[#0A0A0B] text-white overflow-hidden">
        <div className="absolute inset-0">
          <ResilientImage
            src="/src/assets/images/hero_casablanca_gala_1795276846669.jpg"
            alt="Réception de gala haut de gamme à Casablanca organisée par EVENT PRO"
            className="w-full h-full object-cover object-center"
            fallbackLabel="EVENT PRO Casablanca"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0B]/92 via-[#0A0A0B]/70 to-[#0A0A0B]/35" />
        </div>

        <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 py-24 sm:py-32 lg:py-40">
          <div className="max-w-2xl space-y-6">
            <p className="text-xs sm:text-sm font-medium tracking-wide text-[#E5C665]">
              {t.hero.locationTag}
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.08] tracking-tight text-white [text-wrap:balance]">
              {settings.heroTitleFr}
            </h1>
            <p className="text-base sm:text-lg text-white/85 leading-relaxed max-w-xl">
              {settings.heroSubtitleFr}
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onNavigate('/reserver')}
                className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold bg-[#C59B27] text-[#0A0A0B] hover:bg-[#D7AF3C] transition-colors rounded-md whitespace-nowrap shrink-0"
              >
                <span>{t.hero.primaryCta}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/services')}
                className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-medium text-white border border-white/35 hover:border-white hover:bg-white/10 transition-colors rounded-md whitespace-nowrap shrink-0"
              >
                <span>{t.hero.secondaryCta}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Event Categories Section */}
      <section className="py-20 bg-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12 space-y-3">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#0A0A0B]">
              {t.sections.categoriesTitle}
            </h2>
            <p className="text-base text-[#52525B] leading-relaxed">
              {t.sections.categoriesSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {categories.map((cat) => (
              <article
                key={cat.id}
                className="group border border-[#E5E5E0] rounded-lg overflow-hidden bg-white flex flex-col justify-between transition-colors hover:border-[#C59B27]"
              >
                <div>
                  <div className="aspect-[16/10] overflow-hidden bg-[#141417]">
                    <ResilientImage
                      src={cat.imageUrl}
                      alt={getCategoryTitle(cat)}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="p-6 sm:p-8 space-y-4">
                    <h3 className="font-display text-2xl sm:text-3xl font-semibold text-[#0A0A0B]">
                      {getCategoryTitle(cat)}
                    </h3>
                    <p className="text-sm text-[#4A4A52] leading-relaxed">
                      {getCategoryDesc(cat)}
                    </p>
                    <p className="text-xs text-[#6B6B73] leading-relaxed">
                      {cat.subtypes.join(' · ')}
                    </p>
                  </div>
                </div>
                <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      onNavigate(
                        cat.group === 'complementary' ? '/services' : '/reserver',
                        cat.nameFr
                      )
                    }
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#0A0A0B] hover:text-[#A8821B] transition-colors"
                  >
                    <span>{t.sections.discoverBtn}</span>
                    <ArrowRight className="w-4 h-4 text-[#C59B27]" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Explore by Experience (6 Large Hover Cards) */}
      <ExploreByExperienceSection onNavigate={(r) => onNavigate(r)} />

      {/* 4. Why Choose EVENT PRO */}
      <section className="py-20 bg-[#F6F6F4] border-y border-[#E5E5E0]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12 space-y-3">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#0A0A0B]">
              {t.sections.whyTitle}
            </h2>
            <p className="text-base text-[#52525B] leading-relaxed">
              {t.sections.whySubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10">
            {WHY_ITEMS.map((item) => (
              <div key={item.num} className="pt-5 border-t border-[#D8D8D2] space-y-2.5">
                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono text-xs font-medium text-[#A8821B] tabular-nums">
                    {item.num}
                  </span>
                  <h3 className="text-lg font-semibold text-[#0A0A0B]">{item.title}</h3>
                </div>
                <p className="text-sm text-[#4A4A52] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Horizontal Reception Venues Carousel */}
      <VenuesCarouselSection onNavigate={onNavigate} />

      {/* 6. Exclusive Promotional Offers */}
      <ExclusiveOffersSection onNavigate={onNavigate} />

      {/* 7. Masonry Gallery Section */}
      <MasonryGallerySection gallery={gallery} onNavigate={(r) => onNavigate(r)} />

      {/* 8. Recent Formats & Events */}
      <section className="py-20 bg-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div className="max-w-2xl space-y-2">
              <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#0A0A0B]">
                {t.sections.recentEventsTitle}
              </h2>
              <p className="text-sm sm:text-base text-[#52525B]">
                {t.sections.recentEventsSubtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/evenements')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#0A0A0B] hover:text-[#A8821B] whitespace-nowrap shrink-0"
            >
              <span>Voir tous les événements</span>
              <ArrowRight className="w-4 h-4 text-[#C59B27]" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {events.slice(0, 3).map((evt) => (
              <article
                key={evt.id}
                className="border border-[#E5E5E0] rounded-lg overflow-hidden bg-white flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[4/3] bg-[#141417] overflow-hidden">
                    <ResilientImage
                      src={evt.imageUrl}
                      alt={evt.titleFr}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="text-xs text-[#6B6B73]">
                      <span>{evt.category}</span>
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      <span>{evt.city}</span>
                    </div>
                    <h3 className="font-display text-xl font-semibold text-[#0A0A0B] leading-snug">
                      {evt.titleFr}
                    </h3>
                    <p className="text-sm text-[#4A4A52] line-clamp-2">{evt.descriptionFr}</p>
                    <div className="pt-2 space-y-1.5 text-xs text-[#52525B]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#C59B27]" />
                        <span className="tabular-nums">
                          {evt.eventDate} · {evt.eventTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#C59B27]" />
                        <span>{evt.venue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-[#C59B27]" />
                        <span className="tabular-nums">Capacité : {evt.capacity} invités</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <button
                    type="button"
                    onClick={() => onNavigate('/reserver', evt.category)}
                    className="w-full py-2.5 px-4 text-xs font-semibold border border-[#0A0A0B] text-[#0A0A0B] hover:bg-[#0A0A0B] hover:text-white transition-colors rounded-md"
                  >
                    Demander un devis similaire
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Before & After Interactive Comparison Gallery */}
      <BeforeAfterGallerySection onNavigate={onNavigate} />

      {/* 10. Administrable Premium Animated Stats */}
      <section className="py-20 bg-[#0A0A0B] text-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <PremiumStatsSection stats={settings.stats} />
        </div>
      </section>

      {/* 10. Client Love Stories */}
      <ClientLoveStoriesSection testimonials={testimonials} onNavigate={onNavigate} />

      {/* 12. Animated Event Preparation Timeline */}
      <EventTimelineSection onNavigate={onNavigate} />

      {/* 13. Discover Casablanca Interactive Partner Map */}
      <DiscoverCasablancaSection onNavigate={onNavigate} />

      {/* 14. Final Call-to-Action */}
      <section className="py-20 bg-[#F6F6F4]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 text-center space-y-6">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#0A0A0B] max-w-3xl mx-auto [text-wrap:balance]">
            {settings.ctaTitleFr}
          </h2>
          <p className="text-base text-[#52525B] max-w-xl mx-auto">
            Casablanca, Rabat, Marrakech et partout au Maroc. Réponse personnalisée et devis détaillé en MAD.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate('/reserver')}
              className="inline-flex items-center gap-2 px-7 py-4 text-sm font-semibold bg-[#0A0A0B] text-white hover:bg-[#C59B27] hover:text-[#0A0A0B] transition-colors rounded-md"
            >
              <span>{t.sections.ctaButton}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
