import { useMemo, useState } from 'react';
import { ArrowRight, Heart, Quote } from 'lucide-react';
import { useI18n } from '../i18n.tsx';
import type { BookingPreselection, Testimonial } from '../types.ts';
import type { AppRoute } from './Navbar.tsx';

type StoryFilter = 'all' | 'private' | 'corporate';

interface ClientLoveStoriesSectionProps {
  testimonials: Testimonial[];
  onNavigate: (route: AppRoute, preselection?: string | BookingPreselection) => void;
}

function getInitials(name: string): string {
  const parts = name
    .replace(/&/g, ' ')
    .split(/\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return 'EP';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function inferCategoryGroup(eventType: string): 'private' | 'corporate' {
  const lower = eventType.toLowerCase();
  if (
    lower.includes('mariage') ||
    lower.includes('fiançailles') ||
    lower.includes('anniversaire') ||
    lower.includes('priv') ||
    lower.includes('bapt') ||
    lower.includes('cérémonie')
  ) {
    return 'private';
  }
  return 'corporate';
}

function mapBookingCategory(eventType: string): string {
  const lower = eventType.toLowerCase();
  if (lower.includes('gala') || lower.includes('concert') || lower.includes('festival')) {
    return 'Événements Festifs & Culturels';
  }
  if (inferCategoryGroup(eventType) === 'private') {
    return 'Événements Privés';
  }
  return 'Événements Professionnels';
}

export function ClientLoveStoriesSection({
  testimonials,
  onNavigate,
}: ClientLoveStoriesSectionProps) {
  const { lang } = useI18n();
  const [filter, setFilter] = useState<StoryFilter>('all');

  const publishedStories = useMemo(
    () => testimonials.filter((item) => item.isPublished),
    [testimonials]
  );

  const visibleStories = useMemo(() => {
    if (filter === 'all') return publishedStories;
    return publishedStories.filter((item) => inferCategoryGroup(item.eventType) === filter);
  }, [publishedStories, filter]);

  const titleText =
    lang === 'ar'
      ? 'قصص حب العملاء — شهادات وتجارب حقيقية'
      : lang === 'en'
        ? 'Client Love Stories — Words From Our Hosts'
        : 'Client Love Stories — Témoignages & Récits Clients';

  const subtitleText =
    lang === 'ar'
      ? 'تنظيم متقن لحفلات الزفاف والسهرات والفعاليات المهنية في الدار البيضاء وباقي مدن المغرب.'
      : lang === 'en'
        ? 'Private celebrations, executive summits, and black-tie galas crafted with precision across Casablanca and Morocco.'
        : 'Mariages sur mesure, galas d’entreprise et séminaires de direction orchestrés avec exigence à Casablanca et partout au Maroc.';

  const filterTabs: { id: StoryFilter; label: string }[] = [
    {
      id: 'all',
      label: lang === 'ar' ? 'جميع الشهادات' : lang === 'en' ? 'All Stories' : 'Tous les récits',
    },
    {
      id: 'private',
      label:
        lang === 'ar' ? 'المناسبات الخاصة' : lang === 'en' ? 'Private & Weddings' : 'Mariages & Privé',
    },
    {
      id: 'corporate',
      label:
        lang === 'ar' ? 'الفعاليات المهنية' : lang === 'en' ? 'Corporate & Galas' : 'Entreprise & Galas',
    },
  ];

  return (
    <section className="py-24 bg-white border-t border-[#E5E5E0]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 space-y-10">
        {/* Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#A8821B]">
              <Heart className="w-3.5 h-3.5" />
              <span>Client Love Stories · Casablanca &amp; Maroc</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-semibold leading-[1.12] tracking-tight text-[#0A0A0B] [text-wrap:balance]">
              {titleText}
            </h2>
            <p className="text-sm sm:text-base text-[#52525B] leading-relaxed">{subtitleText}</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1 p-1 bg-[#F6F6F4] border border-[#E5E5E0] rounded-lg">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    filter === tab.id
                      ? 'bg-[#0A0A0B] text-white'
                      : 'text-[#4A4A52] hover:text-[#0A0A0B]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stories Grid */}
        {visibleStories.length === 0 ? (
          <div className="p-12 border border-[#E5E5E0] rounded-lg bg-[#F6F6F4] text-center space-y-3">
            <p className="text-sm text-[#52525B]">
              Aucun témoignage publié dans cette catégorie pour le moment.
            </p>
            <button
              type="button"
              onClick={() => setFilter('all')}
              className="px-4 py-2 text-xs font-semibold bg-[#0A0A0B] text-white rounded-md"
            >
              Afficher tous les témoignages
            </button>
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 gap-8 items-stretch ${
              visibleStories.length === 2
                ? 'md:grid-cols-2'
                : 'md:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            {visibleStories.map((item) => {
              const quoteText =
                lang === 'ar'
                  ? item.quoteAr || item.quoteFr
                  : lang === 'en'
                    ? item.quoteEn || item.quoteFr
                    : item.quoteFr;
              const targetCategory = mapBookingCategory(item.eventType);

              return (
                <article
                  key={item.id}
                  className="group border border-[#E5E5E0] hover:border-[#C59B27] rounded-lg bg-white flex flex-col justify-between transition-colors duration-300"
                >
                  <div className="p-7 sm:p-8 space-y-6">
                    {/* Top editorial quote mark & unboxed metadata */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="text-xs text-[#6B6B73] leading-relaxed">
                        <span className="font-semibold text-[#A8821B]">{item.eventType}</span>
                        <span className="mx-1.5" aria-hidden="true">
                          ·
                        </span>
                        <span>{item.companyOrCity}</span>
                      </div>
                      <Quote
                        className="w-6 h-6 text-[#C59B27]/80 shrink-0 transition-transform duration-300 group-hover:scale-110"
                        aria-hidden="true"
                      />
                    </div>

                    {/* Quote body */}
                    <blockquote className="font-display text-[21px] sm:text-[23px] font-medium leading-[1.45] text-[#0A0A0B]">
                      « {quoteText} »
                    </blockquote>
                  </div>

                  {/* Attribution Footer */}
                  <footer className="px-7 sm:px-8 py-5 border-t border-[#E5E5E0] bg-[#FBFBFA] rounded-b-lg space-y-4">
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-11 h-11 rounded-full bg-[#0A0A0B] text-[#E5C665] font-display text-base font-semibold flex items-center justify-center shrink-0 tracking-wide"
                        aria-hidden="true"
                      >
                        {getInitials(item.authorName)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#0A0A0B] truncate">
                          {item.authorName}
                        </div>
                        <div className="text-xs text-[#6B6B73] truncate">{item.authorRole}</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#ECECE6] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onNavigate('/reserver', {
                            category: targetCategory,
                          })
                        }
                        className="inline-flex items-center gap-2 text-xs font-semibold text-[#0A0A0B] hover:text-[#A8821B] transition-colors whitespace-nowrap shrink-0"
                      >
                        <span>
                          {lang === 'ar'
                            ? 'تنظيم حدث مماثل'
                            : lang === 'en'
                              ? 'Plan a similar event'
                              : 'Organiser un événement similaire'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#C59B27]" />
                      </button>
                    </div>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
