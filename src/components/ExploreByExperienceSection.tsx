import { ArrowRight } from 'lucide-react';
import type { AppRoute } from './Navbar.tsx';
import { ResilientImage } from './ResilientImage.tsx';

interface ExperienceCard {
  id: string;
  index: string;
  categoryLabel: string;
  goldHoverTitle: string;
  subtitle: string;
  imageUrl: string;
  targetRoute: AppRoute;
}

const EXPERIENCE_CARDS: ExperienceCard[] = [
  {
    id: 'exp_salles',
    index: '01',
    categoryLabel: 'Salles',
    goldHoverTitle: 'Salles de Réception d’Exception',
    subtitle: 'Villas à Anfa, terrasses panoramiques sur la Corniche et grands salons.',
    imageUrl: '/src/assets/images/venue_anfa_palace_1795278111932.jpg',
    targetRoute: '/services',
  },
  {
    id: 'exp_photographes',
    index: '02',
    categoryLabel: 'Photographes',
    goldHoverTitle: 'Photographes & Films Cinéma',
    subtitle: 'Reportage éditorial, prise de vue multi-caméras et galerie HD privée.',
    imageUrl: '/src/assets/images/exp_photographers_1795278300585.jpg',
    targetRoute: '/services',
  },
  {
    id: 'exp_traiteurs',
    index: '03',
    categoryLabel: 'Traiteurs',
    goldHoverTitle: 'Traiteurs & Haute Gastronomie',
    subtitle: 'Menus marocains raffinés, cuisine internationale et service protocolaire.',
    imageUrl: '/src/assets/images/exp_catering_1795278301793.jpg',
    targetRoute: '/services',
  },
  {
    id: 'exp_dj',
    index: '04',
    categoryLabel: 'DJ',
    goldHoverTitle: 'DJ, Sonorisation & Live',
    subtitle: 'Régie acoustique, éclairage scénique DMX et programmation musicale.',
    imageUrl: '/src/assets/images/exp_dj_sound_1795278300538.jpg',
    targetRoute: '/services',
  },
  {
    id: 'exp_decoration',
    index: '05',
    categoryLabel: 'Décoration',
    goldHoverTitle: 'Décoration & Scénographie',
    subtitle: 'Architecture florale, arts de la table et mobilier design sur mesure.',
    imageUrl: '/src/assets/images/category_services_decor_1795276850581.jpg',
    targetRoute: '/services',
  },
  {
    id: 'exp_organisation',
    index: '06',
    categoryLabel: 'Organisation',
    goldHoverTitle: 'Organisation & Direction de A à Z',
    subtitle: 'Chef de projet dédié, rétroplanning millimétré et coordination terrain.',
    imageUrl: '/src/assets/images/exp_planning_1795278301120.jpg',
    targetRoute: '/reserver',
  },
];

interface ExploreByExperienceSectionProps {
  onNavigate: (route: AppRoute) => void;
}

export function ExploreByExperienceSection({ onNavigate }: ExploreByExperienceSectionProps) {
  return (
    <section className="py-20 bg-[#0A0A0B] text-white">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-2.5">
            <p className="text-xs font-medium tracking-wide text-[#E5C665]">
              Savoir-faire intégrés · Casablanca &amp; Maroc
            </p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white">
              Explore by Experience
            </h2>
            <p className="text-sm sm:text-base text-white/75 leading-relaxed">
              Survolez chaque pôle d’expertise pour découvrir nos prestations dédiées à la réussite de votre événement.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/services')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-[#E5C665] transition-colors whitespace-nowrap shrink-0"
          >
            <span>Tous nos services en MAD</span>
            <ArrowRight className="w-4 h-4 text-[#C59B27]" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {EXPERIENCE_CARDS.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => onNavigate(card.targetRoute)}
              className="group relative aspect-[4/5] w-full text-left rounded-lg overflow-hidden border border-white/15 bg-[#141417] focus-visible:outline-2 focus-visible:outline-[#C59B27]"
            >
              {/* Image with smooth zoom on hover */}
              <ResilientImage
                src={card.imageUrl}
                alt={card.goldHoverTitle}
                className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
              />

              {/* Progressive black veil */}
              <div className="absolute inset-0 bg-[#0A0A0B]/15 transition-colors duration-500 ease-out group-hover:bg-[#0A0A0B]/70 group-focus-visible:bg-[#0A0A0B]/70" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B]/90 via-[#0A0A0B]/25 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100" />

              {/* Top quiet editorial index */}
              <div className="absolute top-5 left-5 right-5 flex items-center justify-between text-xs font-medium text-white/85">
                <span className="font-mono tabular-nums text-[#E5C665]">{card.index}</span>
                <span className="tracking-wide">{card.categoryLabel}</span>
              </div>

              {/* Bottom content: gold title reveals smoothly on hover */}
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7 flex flex-col justify-end space-y-2.5">
                <h3 className="font-display text-2xl sm:text-3xl font-semibold text-[#E5C665] leading-snug opacity-0 translate-y-3 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0">
                  {card.goldHoverTitle}
                </h3>

                <p className="text-xs sm:text-sm text-white/85 leading-relaxed opacity-0 translate-y-3 transition-all duration-500 delay-75 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0">
                  {card.subtitle}
                </p>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-semibold text-white transition-opacity duration-300 group-hover:opacity-0">
                    {card.categoryLabel}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E5C665] opacity-0 translate-x-[-6px] transition-all duration-500 delay-100 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0">
                    <span>Découvrir</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
