import React, { useCallback, useRef, useState } from 'react';
import { ArrowRight, Columns2, MoveHorizontal } from 'lucide-react';
import { useI18n } from '../i18n.tsx';
import type { BookingPreselection } from '../types.ts';
import type { AppRoute } from './Navbar.tsx';
import { ResilientImage } from './ResilientImage.tsx';

interface BeforeAfterTransformation {
  id: string;
  venueFr: string;
  venueAr: string;
  venueEn: string;
  location: string;
  categoryFr: string;
  categoryBooking: string;
  serviceIds: string[];
  setupSummaryFr: string;
  setupSummaryAr: string;
  setupSummaryEn: string;
  beforeImageUrl: string;
  afterImageUrl: string;
}

const TRANSFORMATIONS: BeforeAfterTransformation[] = [
  {
    id: 'ba_anfa',
    venueFr: 'Pavillon Verrière d’Anfa — Mariage & Banquet Floral',
    venueAr: 'جناح الزجاج في أنفا — حفل زفاف ومأدبة فاخرة',
    venueEn: 'Anfa Glass Pavilion — Wedding & Floral Banquet',
    location: 'Anfa Supérieur, Casablanca',
    categoryFr: 'Scénographie Mariage & Art de la Table',
    categoryBooking: 'Événements Privés',
    serviceIds: ['srv_decor', 'srv_furniture', 'srv_sound_light'],
    setupSummaryFr:
      'Métamorphose d’un patio nu sous verrière en réception de mariage aux lustres en cristal, allée d’orchidées blanches et arts de la table dorés.',
    setupSummaryAr:
      'تحويل فضاء زجاجي فارغ إلى قاعة زفاف راقية مع ثريات كريستال وممر من الزهور البيضاء ومائدة ذهبية.',
    setupSummaryEn:
      'Bare glass-roofed courtyard transformed into a crystal-lit wedding banquet with white orchid installations and gilded table settings.',
    beforeImageUrl: '/src/assets/images/before_anfa_palace_1795278972059.jpg',
    afterImageUrl: '/src/assets/images/venue_anfa_palace_1795278111932.jpg',
  },
  {
    id: 'ba_finance',
    venueFr: 'Grand Salon Finance City — Conférence & Dîner Exécutif',
    venueAr: 'الصالون الكبير بالقطب المالي — مؤتمر وعشاء رسمي',
    venueEn: 'Finance City Grand Hall — Summit & Executive Gala',
    location: 'Casablanca Finance City',
    categoryFr: 'Événement Professionnel & Régie Scénique',
    categoryBooking: 'Événements Professionnels',
    serviceIds: ['srv_decor', 'srv_sound_light', 'srv_furniture'],
    setupSummaryFr:
      'Habillage acoustique et lumineux d’un salon architectural vide pour accueillir 450 dirigeants avec scène modulaire, écrans LED et tables de gala.',
    setupSummaryAr:
      'تجهيز صوتي وضوئي لقاعة فارغة لاستقبال 450 مسؤولاً مع منصة حديثة وشاشات عرض وموائد فاخرة.',
    setupSummaryEn:
      'Empty walnut-paneled hall converted into a 450-seat executive summit and gala environment with bespoke lighting and banquet styling.',
    beforeImageUrl: '/src/assets/images/before_finance_auditorium_1795278973223.jpg',
    afterImageUrl: '/src/assets/images/venue_auditorium_finance_1795278113298.jpg',
  },
  {
    id: 'ba_royal',
    venueFr: 'Grand Salon Royal & Coupoles — Soirée de Gala Noir & Or',
    venueAr: 'القاعة الملكية — سهرة غالا بالأسود والذهبي',
    venueEn: 'Royal Cupola Hall — Black & Gold Gala Evening',
    location: 'Quartier Racine, Casablanca',
    categoryFr: 'Gala Prestige & Direction Artistique',
    categoryBooking: 'Événements Festifs & Culturels',
    serviceIds: ['srv_decor', 'srv_catering', 'srv_sound_light'],
    setupSummaryFr:
      'Mise en scène complète d’une grande salle panoramique face à la Mosquée Hassan II : nappage ivoire et or, candélabres et éclairage d’ambiance.',
    setupSummaryAr:
      'تصميم متكامل لقاعة بانورامية مطلة على مسجد الحسن الثاني مع شمعدانات وإضاءة دافئة وموائد احتفالية.',
    setupSummaryEn:
      'Panoramic reception hall overlooking Hassan II Mosque dressed with ivory-and-gold banquet tables, florals, and warm architectural uplighting.',
    beforeImageUrl: '/src/assets/images/before_casablanca_gala_1795278973567.jpg',
    afterImageUrl: '/src/assets/images/hero_casablanca_gala_1795276846669.jpg',
  },
];

interface BeforeAfterGallerySectionProps {
  onNavigate: (route: AppRoute, preselection?: string | BookingPreselection) => void;
}

export function BeforeAfterGallerySection({ onNavigate }: BeforeAfterGallerySectionProps) {
  const { lang } = useI18n();
  const [activeIndex, setActiveIndex] = useState(0);
  const [sliderPercent, setSliderPercent] = useState(52);
  const [isDragging, setIsDragging] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const activePair = TRANSFORMATIONS[activeIndex] || TRANSFORMATIONS[0];

  const updateFromClientX = useCallback((clientX: number) => {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const raw = ((clientX - rect.left) / rect.width) * 100;
    const clamped = Math.max(2, Math.min(98, raw));
    setSliderPercent(clamped);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    updateFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updateFromClientX(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Pointer capture already released
      }
      setIsDragging(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSliderPercent((prev) => Math.max(2, prev - 5));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSliderPercent((prev) => Math.min(98, prev + 5));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setSliderPercent(2);
    } else if (e.key === 'End') {
      e.preventDefault();
      setSliderPercent(98);
    }
  };

  const titleText =
    lang === 'ar'
      ? 'معرض قبل وبعد — تحول القاعات'
      : lang === 'en'
        ? 'Before & After Gallery — Spatial Transformations'
        : 'Galerie Before & After — La Métamorphose des Lieux';

  const subtitleText =
    lang === 'ar'
      ? 'حرّكوا المؤشر التفاعلي لمقارنة القاعة فارغة قبل التجهيز ومع ديكور EVENT PRO الكامل.'
      : lang === 'en'
        ? 'Drag the interactive slider across the venue to compare the bare architectural hall before staging with the finished EVENT PRO scenography.'
        : 'Déplacez le curseur interactif de gauche à droite pour comparer chaque salle nue avant installation avec sa scénographie finale signée EVENT PRO.';

  const activeTitle =
    lang === 'ar'
      ? activePair.venueAr
      : lang === 'en'
        ? activePair.venueEn
        : activePair.venueFr;

  const activeSummary =
    lang === 'ar'
      ? activePair.setupSummaryAr
      : lang === 'en'
        ? activePair.setupSummaryEn
        : activePair.setupSummaryFr;

  return (
    <section className="py-24 bg-[#F6F6F4] border-y border-[#E5E5E0]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 space-y-10">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#A8821B]">
              <Columns2 className="w-3.5 h-3.5" />
              <span>Before &amp; After · Scénographie Casablanca</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-semibold leading-[1.12] tracking-tight text-[#0A0A0B] [text-wrap:balance]">
              {titleText}
            </h2>
            <p className="text-sm sm:text-base text-[#52525B] leading-relaxed">{subtitleText}</p>
          </div>

          {/* Quick Reveal Controls */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white border border-[#E5E5E0] rounded-lg self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setSliderPercent(92)}
              className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                sliderPercent >= 85
                  ? 'bg-[#0A0A0B] text-white'
                  : 'text-[#4A4A52] hover:text-[#0A0A0B]'
              }`}
            >
              Avant (Salle nue)
            </button>
            <button
              type="button"
              onClick={() => setSliderPercent(50)}
              className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                sliderPercent > 20 && sliderPercent < 85
                  ? 'bg-[#0A0A0B] text-white'
                  : 'text-[#4A4A52] hover:text-[#0A0A0B]'
              }`}
            >
              Comparatif 50 / 50
            </button>
            <button
              type="button"
              onClick={() => setSliderPercent(8)}
              className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                sliderPercent <= 20
                  ? 'bg-[#0A0A0B] text-white'
                  : 'text-[#4A4A52] hover:text-[#0A0A0B]'
              }`}
            >
              Après (Décorée)
            </button>
          </div>
        </div>

        {/* Interactive Split Comparison Viewport */}
        <div className="bg-white border border-[#E5E5E0] rounded-xl overflow-hidden">
          <div
            ref={stageRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative aspect-[16/9] max-h-[620px] w-full bg-[#0A0A0B] select-none touch-none cursor-ew-resize overflow-hidden"
          >
            {/* Base Layer: AFTER (Decorated Hall) */}
            <ResilientImage
              key={`after-${activePair.id}`}
              src={activePair.afterImageUrl}
              alt={`${activeTitle} — Après décoration EVENT PRO`}
              className="w-full h-full object-cover pointer-events-none"
              fallbackLabel="Après décoration"
            />

            {/* Clipped Overlay Layer: BEFORE (Bare Architectural Hall) */}
            <div
              className={`absolute inset-0 pointer-events-none ${
                isDragging ? '' : 'transition-[clip-path] duration-300 ease-out'
              }`}
              style={{
                clipPath: `inset(0 ${100 - sliderPercent}% 0 0)`,
              }}
            >
              <ResilientImage
                key={`before-${activePair.id}`}
                src={activePair.beforeImageUrl}
                alt={`${activeTitle} — Avant décoration (salle nue)`}
                className="w-full h-full object-cover"
                fallbackLabel="Avant décoration"
              />
            </div>

            {/* Subtle Bottom Contrast Scrim for Labels */}
            <div
              className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0A0A0B]/75 via-[#0A0A0B]/25 to-transparent pointer-events-none"
              aria-hidden="true"
            />

            {/* Unboxed Before & After Corner Captions */}
            <div
              className={`absolute bottom-5 left-5 sm:left-7 text-xs sm:text-sm font-medium text-white pointer-events-none transition-opacity duration-200 ${
                sliderPercent < 14 ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <span className="text-white/75">Avant</span>
              <span className="mx-1.5 text-white/40" aria-hidden="true">
                ·
              </span>
              <span>Salle nue</span>
            </div>

            <div
              className={`absolute bottom-5 right-5 sm:right-7 text-xs sm:text-sm font-medium text-white pointer-events-none text-right transition-opacity duration-200 ${
                sliderPercent > 86 ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <span className="text-[#E5C665]">Après</span>
              <span className="mx-1.5 text-white/40" aria-hidden="true">
                ·
              </span>
              <span>Décoration EVENT PRO</span>
            </div>

            {/* Vertical Divider Line + Accessible Drag Handle */}
            <div
              role="slider"
              tabIndex={0}
              aria-label="Curseur comparatif avant et après décoration"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(sliderPercent)}
              onKeyDown={handleKeyDown}
              style={{ left: `${sliderPercent}%` }}
              className={`absolute top-0 bottom-0 -translate-x-1/2 z-20 flex items-center justify-center focus:outline-none ${
                isDragging ? '' : 'transition-[left] duration-300 ease-out'
              }`}
            >
              <div className="w-[2px] h-full bg-[#E5C665] shadow-[0_0_16px_rgba(10,10,11,0.65)]" />
              <div
                className={`absolute w-11 h-11 rounded-full bg-[#0A0A0B] border-2 border-[#E5C665] text-[#E5C665] flex items-center justify-center shadow-lg transition-transform duration-150 ${
                  isDragging ? 'scale-110' : 'hover:scale-105'
                }`}
              >
                <MoveHorizontal className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Active Transformation Details Bar */}
          <div className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-t border-[#E5E5E0]">
            <div className="space-y-1.5 max-w-2xl">
              <div className="text-xs font-medium text-[#A8821B]">
                <span>{activePair.categoryFr}</span>
                <span className="mx-1.5 text-[#6B6B73]" aria-hidden="true">
                  ·
                </span>
                <span className="text-[#6B6B73]">{activePair.location}</span>
                <span className="mx-1.5 text-[#6B6B73]" aria-hidden="true">
                  ·
                </span>
                <span className="font-mono text-[#6B6B73] tabular-nums">
                  Révélation : {Math.round(100 - sliderPercent)}% décoré
                </span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-semibold text-[#0A0A0B]">
                {activeTitle}
              </h3>
              <p className="text-sm text-[#4A4A52] leading-relaxed">{activeSummary}</p>
            </div>

            <button
              type="button"
              onClick={() =>
                onNavigate('/reserver', {
                  category: activePair.categoryBooking,
                  serviceIds: activePair.serviceIds,
                })
              }
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs sm:text-sm font-semibold bg-[#0A0A0B] text-white hover:bg-[#C59B27] hover:text-[#0A0A0B] transition-colors rounded-md whitespace-nowrap shrink-0 self-start lg:self-auto"
            >
              <span>Commander cette scénographie</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Venue Transformation Switcher */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TRANSFORMATIONS.map((item, idx) => {
            const isSelected = idx === activeIndex;
            const label =
              lang === 'ar' ? item.venueAr : lang === 'en' ? item.venueEn : item.venueFr;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveIndex(idx);
                  setSliderPercent(52);
                }}
                className={`text-left p-4 rounded-lg border transition-colors flex items-center gap-4 ${
                  isSelected
                    ? 'bg-white border-[#C59B27]'
                    : 'bg-white/70 border-[#E5E5E0] hover:border-[#BDBDB5] hover:bg-white'
                }`}
              >
                <div className="w-20 h-14 rounded overflow-hidden bg-[#141417] shrink-0">
                  <ResilientImage
                    src={item.afterImageUrl}
                    alt={label}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="text-[11px] font-mono font-medium text-[#A8821B] tabular-nums">
                    0{idx + 1}. {item.location}
                  </div>
                  <div className="text-sm font-semibold text-[#0A0A0B] truncate">{label}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
