import React, { useEffect, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, MapPin, Pause, Play, Users } from 'lucide-react';
import type { AppRoute } from './Navbar.tsx';
import { ResilientImage } from './ResilientImage.tsx';

interface ReceptionVenue {
  id: string;
  name: string;
  district: string;
  capacity: string;
  surface: string;
  formatNote: string;
  description: string;
  imageUrl: string;
}

const RECEPTION_VENUES: ReceptionVenue[] = [
  {
    id: 'venue_anfa',
    name: 'Pavillon Verrière d’Anfa',
    district: 'Anfa Supérieur, Casablanca',
    capacity: '320 invités (Banquet) · 480 (Cocktail)',
    surface: '950 m² + Jardins',
    formatNote: 'Mariages, Galas & Réceptions Privées',
    description:
      'Architecture néo-mauresque sous grande verrière étoilée, sol en marbre noir incrusté et ouverture directe sur jardins arborés.',
    imageUrl: '/src/assets/images/venue_anfa_palace_1795278111932.jpg',
  },
  {
    id: 'venue_corniche',
    name: 'Terrasse Panoramique La Corniche',
    district: 'Aïn Diab / Corniche, Casablanca',
    capacity: '220 invités (Assis) · 350 (Cocktail)',
    surface: '700 m² Plein Air',
    formatNote: 'Soirées d’Été, Lancements & Cocktails',
    description:
      'Vue dégagée sur l’Atlantique et la Mosquée Hassan II au crépuscule, pergola architecturale noire et éclairage suspendu sur mesure.',
    imageUrl: '/src/assets/images/venue_corniche_rooftop_1795278111414.jpg',
  },
  {
    id: 'venue_finance',
    name: 'Grand Salon Finance City',
    district: 'Casablanca Finance City',
    capacity: '450 invités (Dîner) · 600 (Conférence)',
    surface: '1 250 m² Modulables',
    formatNote: 'Congrès, Conventions & Galas Corporate',
    description:
      'Salle sans pilier habillée de noyer et de pierre sombre, acoustique traitée, régie LED intégrée et loges VIP attenantes.',
    imageUrl: '/src/assets/images/venue_auditorium_finance_1795278113298.jpg',
  },
  {
    id: 'venue_palais',
    name: 'Grand Salon Royal & Coupoles',
    district: 'Quartier Racine / Centre, Casablanca',
    capacity: '500 invités (Banquet) · 700 (Réception)',
    surface: '1 400 m² Prestige',
    formatNote: 'Grands Mariages & Dîners Officiels',
    description:
      'Hauteur sous coupole exceptionnelle, lustres en cristal, baies cintrées panoramiques et accueil protocolaire dédié.',
    imageUrl: '/src/assets/images/hero_casablanca_gala_1795276846669.jpg',
  },
];

interface VenuesCarouselSectionProps {
  onNavigate: (route: AppRoute, preselectCategory?: string) => void;
}

export function VenuesCarouselSection({ onNavigate }: VenuesCarouselSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const total = RECEPTION_VENUES.length;
  const currentVenue = RECEPTION_VENUES[activeIndex];

  useEffect(() => {
    if (isPaused) return;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [isPaused, total]);

  const goPrev = () => setActiveIndex((prev) => (prev - 1 + total) % total);
  const goNext = () => setActiveIndex((prev) => (prev + 1) % total);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (delta > 45) goPrev();
    if (delta < -45) goNext();
    setTouchStartX(null);
  };

  return (
    <section
      className="py-20 bg-[#0A0A0B] text-white"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 space-y-10">
        {/* Section Header + Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-2.5">
            <p className="text-xs font-medium tracking-wide text-[#E5C665]">
              Lieux d’exception · Casablanca &amp; Environs
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-white">
              Nos Salles de Réception Partenaires
            </h2>
            <p className="text-sm sm:text-base text-white/75 leading-relaxed">
              Espaces vitrés, terrasses océaniques et salons de gala sélectionnés selon votre capacité et votre scénographie.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="font-mono text-xs text-white/70 tabular-nums mr-1">
              {String(activeIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </span>
            <button
              type="button"
              onClick={() => setIsPaused((p) => !p)}
              className="w-10 h-10 rounded-md border border-white/20 text-white/80 hover:border-[#C59B27] hover:text-[#E5C665] flex items-center justify-center transition-colors"
              aria-label={isPaused ? 'Reprendre le défilement' : 'Mettre en pause'}
              title={isPaused ? 'Reprendre' : 'Pause'}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={goPrev}
              className="w-10 h-10 rounded-md border border-white/20 text-white hover:border-[#C59B27] hover:bg-[#C59B27] hover:text-[#0A0A0B] flex items-center justify-center transition-colors"
              aria-label="Salle précédente"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="w-10 h-10 rounded-md border border-white/20 text-white hover:border-[#C59B27] hover:bg-[#C59B27] hover:text-[#0A0A0B] flex items-center justify-center transition-colors"
              aria-label="Salle suivante"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Horizontal Sliding Viewport */}
        <div
          className="relative rounded-lg overflow-hidden border border-white/15 bg-[#141417]"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {RECEPTION_VENUES.map((venue, index) => {
              const isActive = index === activeIndex;
              return (
                <div
                  key={venue.id}
                  className="w-full shrink-0 relative aspect-[16/10] sm:aspect-[16/9] max-h-[600px] overflow-hidden"
                >
                  <ResilientImage
                    src={venue.imageUrl}
                    alt={venue.name}
                    className={`w-full h-full object-cover transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isActive ? 'scale-100 opacity-100' : 'scale-105 opacity-75'
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B]/95 via-[#0A0A0B]/40 to-transparent" />

                  <div className="absolute bottom-0 inset-x-0 p-6 sm:p-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div
                      className={`max-w-2xl space-y-2.5 transition-all duration-500 ${
                        isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                      }`}
                    >
                      <div className="text-xs font-medium text-[#E5C665]">
                        {venue.formatNote} · {venue.surface}
                      </div>
                      <h3 className="font-display text-2xl sm:text-4xl font-semibold text-white leading-tight">
                        {venue.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-white/80 leading-relaxed line-clamp-2 sm:line-clamp-none">
                        {venue.description}
                      </p>
                      <div className="pt-1 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-white/75">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#C59B27]" />
                          <span>{venue.district}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 tabular-nums">
                          <Users className="w-3.5 h-3.5 text-[#C59B27]" />
                          <span>{venue.capacity}</span>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigate('/reserver')}
                      className="inline-flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-semibold bg-[#C59B27] text-[#0A0A0B] hover:bg-[#D7AF3C] transition-colors rounded-md whitespace-nowrap shrink-0 w-fit"
                    >
                      <span>Vérifier la disponibilité</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Horizontal Thumbnail Navigation Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {RECEPTION_VENUES.map((venue, index) => {
            const active = index === activeIndex;
            return (
              <button
                key={venue.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`group text-left rounded-lg overflow-hidden border transition-all duration-200 ${
                  active
                    ? 'border-[#C59B27] bg-white/[0.08]'
                    : 'border-white/15 bg-white/[0.02] hover:border-white/35'
                }`}
              >
                <div className="aspect-[16/9] overflow-hidden bg-[#141417]">
                  <ResilientImage
                    src={venue.imageUrl}
                    alt={venue.name}
                    className={`w-full h-full object-cover transition-transform duration-500 ${
                      active ? 'scale-100' : 'opacity-70 group-hover:opacity-100 group-hover:scale-[1.03]'
                    }`}
                  />
                </div>
                <div className="p-3.5 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white truncate">{venue.name}</span>
                    <span className="font-mono text-[11px] text-[#E5C665] tabular-nums shrink-0">
                      0{index + 1}
                    </span>
                  </div>
                  <div className="text-[11px] text-white/60 truncate">{venue.district}</div>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-white/50">
          Visuels de présentation illustrant les capacités d’accueil de {currentVenue.name}. D’autres lieux partenaires sont proposés sur étude de votre cahier des charges.
        </p>
      </div>
    </section>
  );
}
