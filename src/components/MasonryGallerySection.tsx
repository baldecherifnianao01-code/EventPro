import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Maximize2, Play, X } from 'lucide-react';
import { useI18n } from '../i18n.tsx';
import type { GalleryItem } from '../types.ts';
import type { AppRoute } from './Navbar.tsx';
import { ResilientImage } from './ResilientImage.tsx';

type MasonryFilter = 'all' | 'mariages' | 'decorations' | 'soirees' | 'pro';

interface MasonryGallerySectionProps {
  gallery: GalleryItem[];
  onNavigate: (route: AppRoute) => void;
}

const MASONRY_FILTERS: { id: MasonryFilter; labelFr: string; labelAr: string; labelEn: string }[] = [
  { id: 'all', labelFr: 'Tout voir', labelAr: 'الكل', labelEn: 'All' },
  { id: 'mariages', labelFr: 'Mariages', labelAr: 'الأعراس', labelEn: 'Weddings' },
  { id: 'decorations', labelFr: 'Décorations', labelAr: 'الديكور', labelEn: 'Decor' },
  { id: 'soirees', labelFr: 'Soirées', labelAr: 'السهرات', labelEn: 'Evenings' },
  { id: 'pro', labelFr: 'Événements professionnels', labelAr: 'الفعاليات المهنية', labelEn: 'Corporate Events' },
];

const CATEGORY_LABELS: Record<string, string> = {
  mariages: 'Mariages',
  decorations: 'Décorations',
  soirees: 'Soirées',
  concerts: 'Soirées & Concerts',
  conferences: 'Événements professionnels',
  entreprise: 'Événements professionnels',
  anniversaires: 'Anniversaires',
};

export function MasonryGallerySection({ gallery, onNavigate }: MasonryGallerySectionProps) {
  const { lang } = useI18n();
  const [filter, setFilter] = useState<MasonryFilter>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const visibleItems = useMemo(() => {
    const filtered = gallery.filter((item) => {
      if (filter === 'all') return true;
      if (filter === 'mariages') return item.category === 'mariages';
      if (filter === 'decorations') return item.category === 'decorations';
      if (filter === 'soirees') return item.category === 'soirees' || item.category === 'concerts';
      if (filter === 'pro') return item.category === 'entreprise' || item.category === 'conferences';
      return true;
    });
    return filtered;
  }, [gallery, filter]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev === null ? null : (prev + 1) % visibleItems.length));
      }
      if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev - 1 + visibleItems.length) % visibleItems.length
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxIndex, visibleItems.length]);

  const activeLightboxItem = lightboxIndex !== null ? visibleItems[lightboxIndex] || null : null;

  return (
    <section className="py-20 bg-[#F6F6F4] border-t border-[#E5E5E0]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 space-y-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-2.5">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#0A0A0B]">
              Galerie Masonry — Scénographies &amp; Univers
            </h2>
            <p className="text-sm sm:text-base text-[#52525B] leading-relaxed">
              Mariages d’exception, décorations florales, soirées de gala et événements professionnels mis en scène par EVENT PRO.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('/galerie')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0A0A0B] hover:text-[#A8821B] whitespace-nowrap shrink-0"
          >
            <span>Explorer toute la galerie</span>
            <ArrowRight className="w-4 h-4 text-[#C59B27]" />
          </button>
        </div>

        {/* Category filter tabs */}
        <div className="flex flex-wrap gap-1.5 p-1.5 bg-white border border-[#E5E5E0] rounded-lg w-fit">
          {MASONRY_FILTERS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setFilter(tab.id);
                setLightboxIndex(null);
              }}
              className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                filter === tab.id
                  ? 'bg-[#0A0A0B] text-white'
                  : 'text-[#4A4A52] hover:text-[#0A0A0B]'
              }`}
            >
              {lang === 'ar' ? tab.labelAr : lang === 'en' ? tab.labelEn : tab.labelFr}
            </button>
          ))}
        </div>

        {/* Masonry Waterfall Layout */}
        {visibleItems.length === 0 ? (
          <div className="p-12 bg-white border border-[#E5E5E0] rounded-lg text-center text-sm text-[#6B6B73]">
            Aucun visuel dans cette catégorie pour le moment.
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
            {visibleItems.map((item, idx) => {
              const title = lang === 'ar' ? item.titleAr : lang === 'en' ? item.titleEn : item.titleFr;
              const categoryText = CATEGORY_LABELS[item.category] || item.category;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  className="group relative break-inside-avoid mb-6 block w-full text-left rounded-lg overflow-hidden border border-[#E5E5E0] bg-[#141417] hover:border-[#C59B27] transition-colors focus-visible:outline-2 focus-visible:outline-[#C59B27]"
                >
                  <ResilientImage
                    src={item.thumbnailUrl || item.mediaUrl}
                    alt={title}
                    className="w-full h-auto block object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />

                  {item.mediaType === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <span className="w-12 h-12 rounded-full bg-[#C59B27] text-[#0A0A0B] flex items-center justify-center">
                        <Play className="w-5 h-5 fill-current" />
                      </span>
                    </div>
                  )}

                  {/* Measured bottom contrast scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B]/90 via-[#0A0A0B]/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />

                  <div className="absolute top-3.5 right-3.5 w-8 h-8 rounded-md bg-[#0A0A0B]/70 text-[#E5C665] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-4 h-4" />
                  </div>

                  <div className="absolute bottom-0 inset-x-0 p-5 space-y-1">
                    <div className="text-xs font-medium text-[#E5C665]">
                      {categoryText}
                      {item.isDemoVisual ? ' · Visuel concept' : ''}
                    </div>
                    <h3 className="font-display text-xl font-semibold text-white leading-snug">
                      {title}
                    </h3>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Lightbox Modal */}
        {activeLightboxItem && lightboxIndex !== null && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            onClick={() => setLightboxIndex(null)}
          >
            <div
              className="bg-white rounded-lg max-w-4xl w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E5E0]">
                <div className="min-w-0 pr-4">
                  <div className="text-sm font-semibold text-[#0A0A0B] truncate">
                    {activeLightboxItem.titleFr}
                  </div>
                  <div className="text-xs text-[#6B6B73] truncate">
                    {activeLightboxItem.captionFr}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLightboxIndex(null)}
                  className="p-2 text-[#4A4A52] hover:text-[#0A0A0B] shrink-0"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative bg-[#0A0A0B] max-h-[75vh] flex items-center justify-center">
                {activeLightboxItem.mediaType === 'video' ? (
                  <video
                    src={activeLightboxItem.mediaUrl}
                    controls
                    className="max-h-[75vh] w-full"
                  />
                ) : (
                  <ResilientImage
                    src={activeLightboxItem.mediaUrl}
                    alt={activeLightboxItem.titleFr}
                    className="max-h-[75vh] w-auto object-contain"
                  />
                )}

                {visibleItems.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setLightboxIndex(
                          (lightboxIndex - 1 + visibleItems.length) % visibleItems.length
                        )
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 text-white hover:bg-[#C59B27] hover:text-[#0A0A0B] transition-colors"
                      aria-label="Précédent"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setLightboxIndex((lightboxIndex + 1) % visibleItems.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 text-white hover:bg-[#C59B27] hover:text-[#0A0A0B] transition-colors"
                      aria-label="Suivant"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
