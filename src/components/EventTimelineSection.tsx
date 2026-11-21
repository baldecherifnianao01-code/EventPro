import { useRef, useState } from 'react';
import {
  ArrowRight,
  Award,
  CalendarCheck2,
  Compass,
  FileCheck2,
  SlidersHorizontal,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react';
import { useI18n } from '../i18n.tsx';
import type { BookingPreselection } from '../types.ts';
import type { AppRoute } from './Navbar.tsx';

interface TimelineStep {
  stepNum: string;
  phaseFr: string;
  phaseAr: string;
  phaseEn: string;
  timingFr: string;
  timingAr: string;
  timingEn: string;
  titleFr: string;
  titleAr: string;
  titleEn: string;
  descFr: string;
  descAr: string;
  descEn: string;
  deliverableFr: string;
  deliverableAr: string;
  deliverableEn: string;
  icon: LucideIcon;
}

const TIMELINE_STEPS: TimelineStep[] = [
  {
    stepNum: '01',
    phaseFr: 'Réservation',
    phaseAr: 'الحجز الأولي',
    phaseEn: 'Booking',
    timingFr: 'Jour 0 · En ligne',
    timingAr: 'اليوم 0 · عبر المنصة',
    timingEn: 'Day 0 · Online',
    titleFr: 'Réservation & Cadrage du Projet',
    titleAr: 'الحجز وتحديد ملامح المشروع',
    titleEn: 'Booking & Project Brief',
    descFr:
      'Vous sélectionnez la date, le lieu pressenti, le format, le nombre d’invités et les prestations souhaitées. Votre dossier reçoit immédiatement une référence unique.',
    descAr:
      'تختارون التاريخ والمكان المقترح ونوع الحدث وعدد الضيوف والخدمات المطلوبة مع رقم ملف خاص بكم فوراً.',
    descEn:
      'Select your preferred date, venue style, guest count, and services online. Your request immediately receives a dedicated tracking reference.',
    deliverableFr: 'Livrable : Numéro de dossier & chef de projet attribué',
    deliverableAr: 'المخرجات: رقم تتبع خاص وتعيين مدير مشروع',
    deliverableEn: 'Deliverable: Tracking ID & dedicated project director',
    icon: CalendarCheck2,
  },
  {
    stepNum: '02',
    phaseFr: 'Conception',
    phaseAr: 'التصميم والتخطيط',
    phaseEn: 'Concept',
    timingFr: 'J+2 à J+5 · Repérage',
    timingAr: 'اليوم 2 إلى 5 · المعاينة',
    timingEn: 'Day 2–5 · Scouting',
    titleFr: 'Visite Technique & Direction Artistique',
    titleAr: 'المعاينة الميدانية والإدارة الفنية',
    titleEn: 'Site Scouting & Creative Direction',
    descFr:
      'Repérage du lieu à Casablanca ou dans votre ville, plan d’implantation, moodboard floral et scénographie lumineuse calibrée selon votre budget en DH.',
    descAr:
      'معاينة الفضاء بالدار البيضاء أو مدينتكم، إعداد مخطط التوزيع، لوحة الألوان والديكور حسب ميزانيتكم بالدرهم.',
    descEn:
      'On-site inspection across Casablanca or Morocco, spatial layout, floral moodboards, and lighting scenography calibrated to your budget in MAD.',
    deliverableFr: 'Livrable : Proposition scénographique & devis détaillé',
    deliverableAr: 'المخرجات: تصور فني متكامل وعرض أسعار مفصل',
    deliverableEn: 'Deliverable: Spatial concept & itemized quote',
    icon: Compass,
  },
  {
    stepNum: '03',
    phaseFr: 'Validation',
    phaseAr: 'الاعتماد والتأكيد',
    phaseEn: 'Confirmation',
    timingFr: 'Validation Espace Client',
    timingAr: 'تأكيد عبر فضاء العميل',
    timingEn: 'Client Portal Approval',
    titleFr: 'Signature du Devis & Verrouillage Prestataires',
    titleAr: 'الموافقة على العرض وحجز الشركاء',
    titleEn: 'Quote Approval & Vendor Lock-In',
    descFr:
      'Validation transparente de votre devis dans l’Espace Client, règlement de l’acompte et réservation ferme des salles, traiteurs et régies techniques.',
    descAr:
      'اعتماد عرض السعر بشفافية عبر فضاء العميل، أداء التسبيق وتأكيد الحجز الرسمي للقاعة والتموين والتقنيات.',
    descEn:
      'Approve your quote online, settle the deposit, and lock in your venue, fine caterer, floral artists, and technical crew.',
    deliverableFr: 'Livrable : Facture PDF & rétroplanning personnalisé',
    deliverableAr: 'المخرجات: فاتورة إلكترونية وجدول زمني دقيق',
    deliverableEn: 'Deliverable: Official schedule & PDF deposit invoice',
    icon: FileCheck2,
  },
  {
    stepNum: '04',
    phaseFr: 'Pré-production',
    phaseAr: 'التحضيرات والتجارب',
    phaseEn: 'Pre-Production',
    timingFr: 'S-3 à S-1 · Ajustements',
    timingAr: '3 أسابيع قبل الموعد',
    timingEn: 'Weeks 3–1 Prior',
    titleFr: 'Dégustation Traiteur, Tests & Conducteur',
    titleAr: 'تجربة التموين والتنسيق الدقيق',
    titleEn: 'Menu Tasting, Rehearsals & Run-of-Show',
    descFr:
      'Dégustation des menus gastronomiques, validation des prototypes de table, choix musicaux DJ ou orchestre et rédaction du conducteur minute par minute.',
    descAr:
      'تذوق قوائم الطعام، اعتماد نماذج الموائد، اختيار البرنامج الموسيقي وإعداد برنامج السير الزمني بالدقيقة.',
    descEn:
      'Private culinary tasting, table mockup approval, musical programming with our DJ or ensemble, and minute-by-minute run-of-show.',
    deliverableFr: 'Livrable : Conducteur validé & plan de table final',
    deliverableAr: 'المخرجات: برنامج التنفيذ النهائي ومخطط الجلوس',
    deliverableEn: 'Deliverable: Final run-of-show & seating architecture',
    icon: Sparkles,
  },
  {
    stepNum: '05',
    phaseFr: 'Installation',
    phaseAr: 'التركيب والتجهيز',
    phaseEn: 'Staging',
    timingFr: 'J-1 · Sur site',
    timingAr: 'ليلة الحدث · في الموقع',
    timingEn: 'Day -1 · On Site',
    titleFr: 'Montage Décor, Régie Son & Balances Lumière',
    titleAr: 'تركيب الديكور وضبط الصوت والإضاءة',
    titleEn: 'Full Staging, Audio & Lighting Calibration',
    descFr:
      'Déploiement complet du mobilier, installations florales, écrans LED, éclairage architectural et tests acoustiques sous contrôle de notre régisseur général.',
    descAr:
      'تركيب الأثاث الفاخر، التنسيقات الزهرية، الشاشات والإضاءة المعمارية مع تجارب الصوت بإشراف المدير التقني.',
    descEn:
      'Full deployment of designer furniture, floral structures, LED walls, architectural DMX lighting, and acoustic soundchecks.',
    deliverableFr: 'Livrable : Inspection complète & répétition technique',
    deliverableAr: 'المخرجات: فحص شامل وجاهزية 100%',
    deliverableEn: 'Deliverable: Complete technical sign-off before opening',
    icon: SlidersHorizontal,
  },
  {
    stepNum: '06',
    phaseFr: 'Jour J',
    phaseAr: 'يوم الحدث',
    phaseEn: 'Event Day',
    timingFr: 'Jour J · De A à Z',
    timingAr: 'يوم الحدث · متابعة شاملة',
    timingEn: 'Day J · Full Execution',
    titleFr: 'Accueil Protocolaire & Orchestration Live',
    titleAr: 'الاستقبال الرسمي والإشراف الميداني',
    titleEn: 'VIP Hospitality & Live Orchestration',
    descFr:
      'Accueil multilingue de vos invités, synchronisation discrète des prises de parole, service gastronomique et pilotage continu jusqu’au démontage final.',
    descAr:
      'استقبال الضيوف بطاقم متعدد اللغات، تنسيق الفقرات وخدمة المآدب ومرافقة مستمرة إلى غاية ختام الحفل.',
    descEn:
      'Multilingual VIP guest reception, seamless cue management, culinary pacing, and full on-site supervision through closing.',
    deliverableFr: 'Livrable : Exécution sans faille & bilan de clôture',
    deliverableAr: 'المخرجات: تنفيذ مثالي وتقرير ختامي',
    deliverableEn: 'Deliverable: Seamless execution & post-event wrap-up',
    icon: Award,
  },
];

interface EventTimelineSectionProps {
  onNavigate: (route: AppRoute, preselection?: string | BookingPreselection) => void;
}

export function EventTimelineSection({ onNavigate }: EventTimelineSectionProps) {
  const { lang } = useI18n();
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [revealedSteps, setRevealedSteps] = useState<Record<string, boolean>>({});

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 75%', 'end 70%'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 26,
    restDelta: 0.001,
  });

  const sectionHeading =
    lang === 'ar'
      ? 'الخط الزمني للحدث — من الحجز إلى يوم الحدث'
      : lang === 'en'
        ? 'Event Timeline — From Booking to Day J'
        : 'Event Timeline — De la Réservation au Jour J';

  const sectionSubtitle =
    lang === 'ar'
      ? 'ست مراحل دقيقة وواضحة تضمن لكم التحضير المريح والنتيجة المثالية لكل مناسبة.'
      : lang === 'en'
        ? 'Six structured milestones guiding your event seamlessly from initial online booking to flawless Day-J execution.'
        : 'Six étapes maîtrisées pour orchestrer votre événement avec clarté, rigueur et sérénité depuis votre demande en ligne jusqu’au soir du Jour J.';

  const markRevealed = (stepNum: string) => {
    setRevealedSteps((prev) => (prev[stepNum] ? prev : { ...prev, [stepNum]: true }));
  };

  return (
    <section className="py-24 bg-[#0A0A0B] text-white border-t border-white/10">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 space-y-16">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#E5C665]">
              Event Timeline · Méthodologie EVENT PRO
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-semibold leading-[1.12] tracking-tight text-white [text-wrap:balance]">
              {sectionHeading}
            </h2>
            <p className="text-sm sm:text-base text-white/75 leading-relaxed">
              {sectionSubtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('/reserver')}
            className="inline-flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-semibold bg-[#C59B27] text-[#0A0A0B] hover:bg-[#D7AF3C] transition-colors rounded-md whitespace-nowrap shrink-0 self-start lg:self-auto"
          >
            <span>
              {lang === 'ar'
                ? 'ابدأ المرحلة 01 — احجز الآن'
                : lang === 'en'
                  ? 'Start Step 01 — Book Now'
                  : 'Lancer l’étape 01 — Réserver'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Animated Timeline Spine + Steps */}
        <div ref={containerRef} className="relative">
          {/* Base muted spine track */}
          <div
            className="absolute left-5 lg:left-1/2 top-2 bottom-2 w-px bg-white/15 lg:-translate-x-1/2"
            aria-hidden="true"
          />

          {/* Scroll-driven golden progress spine */}
          <motion.div
            aria-hidden="true"
            style={{
              scaleY: shouldReduceMotion ? 1 : smoothProgress,
            }}
            className="absolute left-5 lg:left-1/2 top-2 bottom-2 w-[2px] bg-gradient-to-b from-[#E5C665] via-[#C59B27] to-[#D4AF37] origin-top lg:-translate-x-1/2"
          />

          <div className="space-y-10 lg:space-y-14">
            {TIMELINE_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 0;
              const isActive = Boolean(shouldReduceMotion || revealedSteps[step.stepNum]);

              const phase =
                lang === 'ar' ? step.phaseAr : lang === 'en' ? step.phaseEn : step.phaseFr;
              const timing =
                lang === 'ar' ? step.timingAr : lang === 'en' ? step.timingEn : step.timingFr;
              const title =
                lang === 'ar' ? step.titleAr : lang === 'en' ? step.titleEn : step.titleFr;
              const desc =
                lang === 'ar' ? step.descAr : lang === 'en' ? step.descEn : step.descFr;
              const deliverable =
                lang === 'ar'
                  ? step.deliverableAr
                  : lang === 'en'
                    ? step.deliverableEn
                    : step.deliverableFr;

              return (
                <motion.article
                  key={step.stepNum}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.28 }}
                  transition={{
                    duration: 0.55,
                    ease: [0.16, 1, 0.3, 1],
                    delay: 0.05,
                  }}
                  onViewportEnter={() => markRevealed(step.stepNum)}
                  className="relative grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16 items-center"
                >
                  {/* Central / Left Milestone Marker */}
                  <div
                    className={`absolute left-5 lg:left-1/2 top-6 lg:top-1/2 -translate-x-1/2 lg:-translate-y-1/2 z-10 w-10 h-10 rounded-full border flex items-center justify-center transition-colors duration-300 ${
                      isActive
                        ? 'bg-[#C59B27] border-[#E5C665] text-[#0A0A0B]'
                        : 'bg-[#141417] border-white/25 text-white/70'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Card Column (alternates left/right on lg desktop) */}
                  <div
                    className={`pl-14 lg:pl-0 ${
                      isEven ? 'lg:col-start-1 lg:pr-8' : 'lg:col-start-2 lg:pl-8'
                    }`}
                  >
                    <div
                      className={`p-6 sm:p-8 rounded-lg border transition-colors duration-300 space-y-4 ${
                        isActive
                          ? 'bg-[#141417] border-[#C59B27]/55'
                          : 'bg-[#141417]/80 border-white/15'
                      }`}
                    >
                      {/* Unboxed Step Metadata */}
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                        <span className="font-mono font-semibold text-[#E5C665] tabular-nums">
                          Étape {step.stepNum}
                        </span>
                        <span className="text-white/35" aria-hidden="true">
                          ·
                        </span>
                        <span className="font-medium text-white/85">{phase}</span>
                        <span className="text-white/35" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-white/60">{timing}</span>
                      </div>

                      <h3 className="font-display text-2xl sm:text-[26px] font-semibold text-white leading-snug">
                        {title}
                      </h3>

                      <p className="text-sm text-white/75 leading-relaxed">{desc}</p>

                      <div className="pt-3 border-t border-white/10 text-xs font-medium text-[#E5C665]">
                        {deliverable}
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
