import { useEffect, useRef, useState } from 'react';
import { Award, CalendarCheck2, ClipboardCheck, Handshake } from 'lucide-react';
import { useI18n } from '../i18n.tsx';
import type { AdminStatEntry } from '../types.ts';

interface PremiumStatsSectionProps {
  stats: AdminStatEntry[];
}

function parseStatTarget(rawValue: string): { target: number; suffix: string } {
  const match = rawValue.trim().match(/^(\d+)(.*)$/);
  if (!match) return { target: 0, suffix: '' };
  return {
    target: Number.parseInt(match[1], 10) || 0,
    suffix: match[2] || '',
  };
}

function AnimatedCounter({
  rawValue,
  shouldAnimate,
}: {
  rawValue: string;
  shouldAnimate: boolean;
}) {
  const { target, suffix } = parseStatTarget(rawValue);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!shouldAnimate) {
      setDisplayValue(0);
      return;
    }

    if (target <= 0) {
      setDisplayValue(0);
      return;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setDisplayValue(target);
      return;
    }

    let rafId = 0;
    const durationMs = 1600;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      // Smooth easeOutCubic curve
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(target * eased));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [shouldAnimate, target]);

  return (
    <span className="tabular-nums">
      {new Intl.NumberFormat('fr-MA').format(displayValue)}
      {suffix}
    </span>
  );
}

function StatIcon({ statKey }: { statKey: AdminStatEntry['key'] }) {
  const iconClass = 'w-6 h-6 text-[#D4AF37]';
  switch (statKey) {
    case 'events':
      return <CalendarCheck2 className={iconClass} />;
    case 'clients':
      return <Award className={iconClass} />;
    case 'partners':
      return <Handshake className={iconClass} />;
    case 'bookings':
    default:
      return <ClipboardCheck className={iconClass} />;
  }
}

export function PremiumStatsSection({ stats }: PremiumStatsSectionProps) {
  const { lang, t } = useI18n();
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [hasEnteredViewport, setHasEnteredViewport] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setHasEnteredViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setHasEnteredViewport(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sectionRef} className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white">
            {t.sections.statsTitle}
          </h2>
          <p className="text-sm text-white/70 max-w-xl">
            Des repères chiffrés administrables reflétant notre engagement opérationnel à Casablanca et partout au Maroc.
          </p>
        </div>
        <p className="text-xs text-white/55 whitespace-nowrap">
          Indicateurs administrables dans /admin
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((st) => {
          const label = lang === 'ar' ? st.labelAr : lang === 'en' ? st.labelEn : st.labelFr;
          return (
            <div
              key={st.key}
              className="bg-white text-[#0A0A0B] border border-white/20 rounded-lg p-7 flex flex-col justify-between space-y-5 transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div className="w-12 h-12 rounded-md bg-[#0A0A0B] border border-[#C59B27]/40 flex items-center justify-center">
                <StatIcon statKey={st.key} />
              </div>

              <div className="space-y-1.5">
                <div className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[#0A0A0B] tabular-nums">
                  <AnimatedCounter rawValue={st.value} shouldAnimate={hasEnteredViewport} />
                </div>
                <div className="text-sm font-semibold text-[#0A0A0B]">{label}</div>
                <div className="text-xs text-[#52525B] leading-relaxed">
                  {st.unitOrContext}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
