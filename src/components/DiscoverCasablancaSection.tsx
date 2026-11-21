import { useState } from 'react';
import {
  ArrowRight,
  Clock,
  Compass,
  Mail,
  MapPin,
  Minus,
  Phone,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { useI18n } from '../i18n.tsx';
import type { BookingPreselection } from '../types.ts';
import type { AppRoute } from './Navbar.tsx';

export type CasablancaDistrictId = 'maarif' | 'anfa' | 'ain-diab' | 'bouskoura' | 'californie';

interface DistrictProvider {
  id: string;
  name: string;
  category: string;
  bookingCategory: string;
  serviceId: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  specialtyFr: string;
  specialtyAr: string;
  specialtyEn: string;
}

interface CasablancaDistrict {
  id: CasablancaDistrictId;
  name: string;
  tagFr: string;
  x: number;
  y: number;
  labelAlign: 'left' | 'right';
  providers: DistrictProvider[];
}

const CASABLANCA_DISTRICTS: CasablancaDistrict[] = [
  {
    id: 'ain-diab',
    name: 'Ain Diab',
    tagFr: 'Façade Océanique · Corniche',
    x: 155,
    y: 165,
    labelAlign: 'right',
    providers: [
      {
        id: 'prov_aindiab_1',
        name: 'Maison Atlantique Traiteur & Cocktails',
        category: 'Traiteur & Haute Restauration',
        bookingCategory: 'Événements Privés',
        serviceId: 'srv_catering',
        address: 'Boulevard de la Corniche, Résidence Océan, Ain Diab, Casablanca',
        phone: '+212 522 79 41 10',
        email: 'corniche@eventpro.ma',
        hours: 'Lun – Dim · 09h00 – 21h00',
        specialtyFr:
          'Dîners gastronomiques face à l’océan, cocktails sunset sur rooftop et service protocolaire.',
        specialtyAr: 'مآدب فاخرة مطلة على المحيط، حفلات كوكتيل عند الغروب وخدمة راقية.',
        specialtyEn:
          'Oceanfront fine dining, sunset rooftop cocktail receptions, and white-glove banquet service.',
      },
      {
        id: 'prov_aindiab_2',
        name: 'Océan Sound & Sunset Stage',
        category: 'Sonorisation & Éclairage',
        bookingCategory: 'Événements Festifs & Culturels',
        serviceId: 'srv_sound_light',
        address: '24 Rue des Dunes, Ain Diab, Casablanca',
        phone: '+212 522 79 88 24',
        email: 'tech-aindiab@eventpro.ma',
        hours: 'Lun – Sam · 09h30 – 19h30',
        specialtyFr:
          'Régie acoustique plein air résistante aux embruns, éclairage architectural et DJ live.',
        specialtyAr: 'أنظمة صوتية خارجية وإضاءة معمارية مع تجهيز حفلات الشاطئ والتراسات.',
        specialtyEn:
          'Outdoor coastal audio arrays, architectural lighting, and sunset DJ stage production.',
      },
    ],
  },
  {
    id: 'anfa',
    name: 'Anfa',
    tagFr: 'Villas de Réception & Prestige',
    x: 298,
    y: 196,
    labelAlign: 'right',
    providers: [
      {
        id: 'prov_anfa_1',
        name: 'Atelier Floral & Scénographie d’Anfa',
        category: 'Décoration Événementielle',
        bookingCategory: 'Événements Privés',
        serviceId: 'srv_decor',
        address: '18 Boulevard d’Anfa, Quartier Anfa Supérieur, Casablanca',
        phone: '+212 522 36 18 90',
        email: 'atelier-anfa@eventpro.ma',
        hours: 'Lun – Sam · 09h00 – 19h00',
        specialtyFr:
          'Arches florales d’exception, scénographie noir & or sur mesure et arts de la table.',
        specialtyAr: 'تصميم أقواس الزهور الفاخرة وديكور الأسود والذهبي حسب الطلب.',
        specialtyEn:
          'Sculptural floral arches, bespoke black-and-gold scenography, and luxury table styling.',
      },
      {
        id: 'prov_anfa_2',
        name: 'Pavillon Verrière d’Anfa',
        category: 'Location de Salles & Lieux',
        bookingCategory: 'Événements Privés',
        serviceId: 'srv_venue',
        address: 'Angle Rue d’Auteuil, Anfa Supérieur, Casablanca',
        phone: '+212 522 39 52 00',
        email: 'anfa-venues@eventpro.ma',
        hours: 'Sur rendez-vous · 09h00 – 20h00',
        specialtyFr:
          'Privatisation de villas arborées et verrières panoramiques jusqu’à 480 invités.',
        specialtyAr: 'كراء الفيلات الفاخرة والقاعات الزجاجية لغاية 480 ضيفاً.',
        specialtyEn:
          'Private gardens, glass pavilions, and heritage villas accommodating up to 480 guests.',
      },
    ],
  },
  {
    id: 'maarif',
    name: 'Maarif',
    tagFr: 'Cœur Urbain & Studios',
    x: 432,
    y: 232,
    labelAlign: 'right',
    providers: [
      {
        id: 'prov_maarif_1',
        name: 'Studio Lumière & Cinéma Maarif',
        category: 'Photographie & Vidéographie',
        bookingCategory: 'Événements Privés',
        serviceId: 'srv_photo_video',
        address: '112 Boulevard Al Massira Al Khadra, Maarif, Casablanca',
        phone: '+212 522 25 64 30',
        email: 'studio-maarif@eventpro.ma',
        hours: 'Lun – Sam · 09h30 – 19h00',
        specialtyFr:
          'Reportage photo éditorial, captation multi-caméras 4K et livraison de films sous 7 jours.',
        specialtyAr: 'تصوير فوتوغرافي سينمائي وتغطية فيديو 4K متعددة الكاميرات.',
        specialtyEn:
          'Editorial event photography, multi-cam 4K cinema films, and same-week curated galleries.',
      },
      {
        id: 'prov_maarif_2',
        name: 'Collectif Protocol & Hôtesses Casa',
        category: 'Hôtesses & Personnel Événementiel',
        bookingCategory: 'Événements Professionnels',
        serviceId: 'srv_hostesses',
        address: '34 Rue Ibnou Jahir, Quartier Maarif, Casablanca',
        phone: '+212 522 98 14 75',
        email: 'accueil@eventpro.ma',
        hours: 'Lun – Ven · 08h30 – 18h30',
        specialtyFr:
          'Équipes d’accueil multilingues (FR/AR/EN), émargement QR et encadrement VIP.',
        specialtyAr: 'طاقم استقبال متعدد اللغات وتنظيم دخول الضيوف وكبار الشخصيات.',
        specialtyEn:
          'Multilingual hospitality hosts, digital badge check-in, and VIP protocol coordination.',
      },
    ],
  },
  {
    id: 'californie',
    name: 'Californie',
    tagFr: 'Showrooms & Mobilier Design',
    x: 470,
    y: 356,
    labelAlign: 'right',
    providers: [
      {
        id: 'prov_calif_1',
        name: 'Maison Mobilier & Scène Californie',
        category: 'Location de Mobilier Design',
        bookingCategory: 'Événements Festifs & Culturels',
        serviceId: 'srv_furniture',
        address: 'Avenue de Fès, Showroom 7, Quartier Californie, Casablanca',
        phone: '+212 522 50 72 19',
        email: 'mobilier@eventpro.ma',
        hours: 'Lun – Sam · 09h00 – 18h30',
        specialtyFr:
          'Chaises velours & laiton, salons lounge extérieurs, bars lumineux et pupitres conférence.',
        specialtyAr: 'كراء الأثاث الفاخر، جلسات اللاونج الخارجية ومنصات المؤتمرات.',
        specialtyEn:
          'Velvet banquet seating, illuminated lounge bars, and executive conference stages.',
      },
      {
        id: 'prov_calif_2',
        name: 'Tempo & Orchestre Privé',
        category: 'DJ, Orchestre & Animation Live',
        bookingCategory: 'Événements Festifs & Culturels',
        serviceId: 'srv_dj_animation',
        address: 'Lotissement Yasmina, Rue 4, Californie, Casablanca',
        phone: '+212 522 21 44 63',
        email: 'musique@eventpro.ma',
        hours: 'Mar – Dim · 10h00 – 20h00',
        specialtyFr:
          'DJ résidents, quatuors jazz acoustiques et formations andalouses sur mesure.',
        specialtyAr: 'دي جي محترف، فرق موسيقية حية ومجموعات أندلسية راقية.',
        specialtyEn:
          'Curated resident DJs, acoustic jazz quartets, and live Moroccan-Andalusian ensembles.',
      },
    ],
  },
  {
    id: 'bouskoura',
    name: 'Bouskoura',
    tagFr: 'Domaines Nature & Logistique',
    x: 416,
    y: 472,
    labelAlign: 'right',
    providers: [
      {
        id: 'prov_bouskoura_1',
        name: 'Domaine des Pins Réceptions',
        category: 'Location de Salles & Domaines',
        bookingCategory: 'Événements Privés',
        serviceId: 'srv_venue',
        address: 'Route de la Forêt, Ville Verte, Bouskoura, Casablanca',
        phone: '+212 522 59 03 80',
        email: 'bouskoura@eventpro.ma',
        hours: 'Lun – Dim · 09h00 – 19h30',
        specialtyFr:
          'Grands espaces verts arborés et chapiteaux vitrés climatisés jusqu’à 700 invités.',
        specialtyAr: 'فضاءات طبيعية واسعة وخيام زجاجية مكيفة تستوعب حتى 700 ضيف.',
        specialtyEn:
          'Forested reception estates and glass-walled pavilions hosting up to 700 guests.',
      },
      {
        id: 'prov_bouskoura_2',
        name: 'Fleet VIP & Logistique Sud',
        category: 'Transport & Logistique',
        bookingCategory: 'Événements Professionnels',
        serviceId: 'srv_logistics',
        address: 'Parc Logistique Ville Verte, Bouskoura, Casablanca',
        phone: '+212 522 33 91 05',
        email: 'logistique@eventpro.ma',
        hours: '7j/7 · Coordination 24h/24',
        specialtyFr:
          'Transferts aéroport Mohammed V, flotte de berlines avec chauffeur et navettes invités.',
        specialtyAr: 'نقل كبار الشخصيات من المطار وأسطول سيارات فاخرة مع سائقين.',
        specialtyEn:
          'Mohammed V Airport transfers, executive chauffeured sedans, and guest shuttles.',
      },
    ],
  },
];

interface DiscoverCasablancaSectionProps {
  onNavigate: (route: AppRoute, preselection?: string | BookingPreselection) => void;
}

export function DiscoverCasablancaSection({ onNavigate }: DiscoverCasablancaSectionProps) {
  const { lang } = useI18n();
  const [selectedDistrictId, setSelectedDistrictId] = useState<CasablancaDistrictId>('anfa');
  const [selectedProviderIdx, setSelectedProviderIdx] = useState(0);
  const [zoomLevel, setZoomLevel] = useState<1 | 1.25 | 1.5>(1);

  const activeDistrict =
    CASABLANCA_DISTRICTS.find((d) => d.id === selectedDistrictId) || CASABLANCA_DISTRICTS[1];
  const activeProvider =
    activeDistrict.providers[selectedProviderIdx] || activeDistrict.providers[0];

  const handleSelectDistrict = (id: CasablancaDistrictId) => {
    setSelectedDistrictId(id);
    setSelectedProviderIdx(0);
  };

  // Gentle pan offset toward active marker when zoomed in
  const panOriginX = (activeDistrict.x / 800) * 100;
  const panOriginY = (activeDistrict.y / 560) * 100;

  const titleText =
    lang === 'ar'
      ? 'اكتشف الدار البيضاء — خريطة الشركاء حسب الأحياء'
      : lang === 'en'
        ? 'Discover Casablanca — Interactive Partner Map'
        : 'Discover Casablanca — Carte Interactive des Prestataires';

  const subtitleText =
    lang === 'ar'
      ? 'اضغطوا على أي حي لاستعراض المزودين المعتمدين في المعاريف، أنفا، عين الدياب، بوسكورة وكاليفورنيا.'
      : lang === 'en'
        ? 'Select any district pin across Maarif, Anfa, Ain Diab, Bouskoura, and Californie to inspect vetted local event partners.'
        : 'Cliquez sur un marqueur de quartier (Maarif, Anfa, Ain Diab, Bouskoura, Californie) pour consulter la fiche détaillée et les coordonnées du prestataire.';

  const specialtyText =
    lang === 'ar'
      ? activeProvider.specialtyAr
      : lang === 'en'
        ? activeProvider.specialtyEn
        : activeProvider.specialtyFr;

  return (
    <section className="py-24 bg-white border-t border-[#E5E5E0]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 space-y-10">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#A8821B]">
              <Compass className="w-3.5 h-3.5" />
              <span>Discover Casablanca · Réseau Local 5 Quartiers</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-semibold leading-[1.12] tracking-tight text-[#0A0A0B] [text-wrap:balance]">
              {titleText}
            </h2>
            <p className="text-sm sm:text-base text-[#52525B] leading-relaxed">{subtitleText}</p>
          </div>

          {/* Interactive Neighborhood Selector Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#F6F6F4] border border-[#E5E5E0] rounded-lg self-start lg:self-auto">
            {CASABLANCA_DISTRICTS.map((dist) => {
              const isActive = dist.id === activeDistrict.id;
              return (
                <button
                  key={dist.id}
                  type="button"
                  onClick={() => handleSelectDistrict(dist.id)}
                  className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#0A0A0B] text-white'
                      : 'text-[#4A4A52] hover:text-[#0A0A0B]'
                  }`}
                >
                  {dist.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Map + Provider Detail Fiche */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Custom Interactive Vector Map of Casablanca */}
          <div className="lg:col-span-7 relative bg-[#0B0C10] border border-[#23252C] rounded-xl overflow-hidden min-h-[420px] sm:min-h-[500px] select-none">
            {/* Map Controls (Zoom & Reset) */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setZoomLevel((prev) => (prev === 1 ? 1.25 : prev === 1.25 ? 1.5 : 1.5))
                }
                aria-label="Zoomer sur la carte"
                className="w-9 h-9 rounded-md bg-[#14151A]/95 border border-white/15 text-white hover:border-[#C59B27] hover:text-[#E5C665] flex items-center justify-center transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setZoomLevel((prev) => (prev === 1.5 ? 1.25 : prev === 1.25 ? 1 : 1))
                }
                aria-label="Dézoomer sur la carte"
                className="w-9 h-9 rounded-md bg-[#14151A]/95 border border-white/15 text-white hover:border-[#C59B27] hover:text-[#E5C665] flex items-center justify-center transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                aria-label="Réinitialiser la vue de la carte"
                className="w-9 h-9 rounded-md bg-[#14151A]/95 border border-white/15 text-white hover:border-[#C59B27] hover:text-[#E5C665] flex items-center justify-center transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Map Top-Left Legend */}
            <div className="absolute top-4 left-4 z-20 px-3.5 py-2 rounded-md bg-[#14151A]/90 border border-white/15 text-xs text-white/80 pointer-events-none">
              <span className="font-semibold text-[#E5C665]">Casablanca</span>
              <span className="mx-1.5 text-white/35" aria-hidden="true">
                ·
              </span>
              <span>5 zones couvertes</span>
            </div>

            {/* Interactive SVG & Pin Layer */}
            <div
              className="w-full h-full min-h-[420px] sm:min-h-[500px] transition-transform duration-500 ease-out"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: `${panOriginX}% ${panOriginY}%`,
              }}
            >
              <svg
                viewBox="0 0 800 560"
                className="w-full h-full min-h-[420px] sm:min-h-[500px] object-cover"
                role="img"
                aria-label="Carte interactive des quartiers événementiels de Casablanca : Ain Diab, Anfa, Maarif, Californie et Bouskoura"
              >
                {/* Urban Land Base */}
                <rect width="800" height="560" fill="#121318" />

                {/* Subtle Topographic Grid */}
                <g stroke="#FFFFFF" strokeOpacity="0.035" strokeWidth="1">
                  <line x1="0" y1="112" x2="800" y2="112" />
                  <line x1="0" y1="224" x2="800" y2="224" />
                  <line x1="0" y1="336" x2="800" y2="336" />
                  <line x1="0" y1="448" x2="800" y2="448" />
                  <line x1="160" y1="0" x2="160" y2="560" />
                  <line x1="320" y1="0" x2="320" y2="560" />
                  <line x1="480" y1="0" x2="480" y2="560" />
                  <line x1="640" y1="0" x2="640" y2="560" />
                </g>

                {/* Atlantic Ocean Coastline (Northwest) */}
                <path
                  d="M0,0 L560,0 C505,46 435,88 355,112 C275,136 215,138 155,148 C95,158 45,196 0,248 Z"
                  fill="#0D1622"
                />
                {/* Corniche Coastal Accent Line */}
                <path
                  d="M0,248 C45,196 95,158 155,148 C215,138 275,136 355,112 C435,88 505,46 560,0"
                  fill="none"
                  stroke="#C59B27"
                  strokeOpacity="0.45"
                  strokeWidth="2"
                />

                {/* Bouskoura Green Belt / Forest (South) */}
                <path
                  d="M280,445 C340,418 485,425 535,475 C570,510 530,560 440,560 L265,560 C235,515 240,468 280,445 Z"
                  fill="#13211B"
                  stroke="#2B4237"
                  strokeOpacity="0.55"
                  strokeWidth="1"
                />

                {/* Primary Casablanca Boulevards & Corridors */}
                <g fill="none" stroke="#2D303B" strokeLinecap="round">
                  {/* Bd de la Corniche -> Bd d'Anfa -> Centre */}
                  <path d="M90,210 Q240,180 465,162 T690,155" strokeWidth="2.5" />
                  {/* Bd Zerktouni / Al Massira */}
                  <path d="M250,155 Q390,215 585,228" strokeWidth="2.5" />
                  {/* Axis Anfa -> Maarif -> Californie -> Bouskoura */}
                  <path d="M298,196 L432,232 L470,356 L416,472" strokeWidth="2" strokeDasharray="4 4" stroke="#C59B27" strokeOpacity="0.35" />
                  {/* Rocade / Route d'El Jadida & Route de Bouskoura */}
                  <path d="M185,330 Q415,342 665,315" strokeWidth="2" />
                  <path d="M432,232 Q480,350 405,540" strokeWidth="2.5" />
                  <path d="M155,165 Q235,285 370,410" strokeWidth="1.5" />
                </g>

                {/* Geographic Context Labels */}
                <text
                  x="130"
                  y="74"
                  fill="#7D91AD"
                  fontSize="12"
                  fontWeight="500"
                  letterSpacing="2.4"
                >
                  OCÉAN ATLANTIQUE
                </text>
                <text x="585" y="138" fill="#5D6270" fontSize="11">
                  Marina &amp; Port
                </text>
                <text x="338" y="532" fill="#5B7E6D" fontSize="11">
                  Forêt de Bouskoura
                </text>

                {/* Interactive District Pin Markers */}
                {CASABLANCA_DISTRICTS.map((dist) => {
                  const isSelected = dist.id === activeDistrict.id;
                  return (
                    <g
                      key={dist.id}
                      transform={`translate(${dist.x}, ${dist.y})`}
                      onClick={() => handleSelectDistrict(dist.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectDistrict(dist.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Afficher les prestataires du quartier ${dist.name}`}
                      aria-pressed={isSelected}
                      className="cursor-pointer focus:outline-none group"
                    >
                      {/* Outer Selection Halo */}
                      {isSelected && (
                        <circle
                          r="24"
                          fill="#C59B27"
                          fillOpacity="0.18"
                          stroke="#E5C665"
                          strokeOpacity="0.65"
                          strokeWidth="1.5"
                        />
                      )}

                      {/* Invisible generous touch target */}
                      <circle r="24" fill="transparent" />

                      {/* Pin Body */}
                      <circle
                        r={isSelected ? '11' : '8.5'}
                        fill={isSelected ? '#C59B27' : '#181920'}
                        stroke={isSelected ? '#FFFFFF' : '#E5C665'}
                        strokeWidth={isSelected ? '2.5' : '2'}
                        className="transition-all duration-200 group-hover:scale-110"
                      />
                      <circle
                        r={isSelected ? '3.5' : '2.5'}
                        fill={isSelected ? '#0A0A0B' : '#E5C665'}
                      />

                      {/* Clean Map Label Box */}
                      <g transform="translate(16, -12)">
                        <rect
                          x="0"
                          y="0"
                          width={dist.name.length * 8.4 + 22}
                          height="24"
                          rx="4"
                          fill={isSelected ? '#C59B27' : '#14151B'}
                          fillOpacity="0.95"
                          stroke={isSelected ? '#E5C665' : '#2E313D'}
                          strokeWidth="1"
                        />
                        <text
                          x="11"
                          y="16"
                          fill={isSelected ? '#0A0A0B' : '#FFFFFF'}
                          fontSize="12"
                          fontWeight="600"
                        >
                          {dist.name}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Bottom District Indicator Strip */}
            <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-md bg-[#14151A]/90 border border-white/15 text-xs text-white/75 pointer-events-none">
              <span>
                Quartier actif :{' '}
                <strong className="text-[#E5C665] font-semibold">{activeDistrict.name}</strong>
              </span>
              <span className="tabular-nums text-white/55">
                {activeDistrict.providers.length} prestataires partenaires
              </span>
            </div>
          </div>

          {/* Right: Selected Provider Fiche Card */}
          <aside className="lg:col-span-5 bg-[#F6F6F4] border border-[#E5E5E0] rounded-xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              {/* District Header & Provider Switcher */}
              <div className="space-y-3">
                <div className="text-xs font-medium text-[#A8821B]">
                  <span>Quartier {activeDistrict.name}</span>
                  <span className="mx-1.5 text-[#6B6B73]" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-[#6B6B73]">{activeDistrict.tagFr}</span>
                </div>

                {activeDistrict.providers.length > 1 && (
                  <div className="flex flex-wrap gap-1.5 p-1 bg-white border border-[#E5E5E0] rounded-lg">
                    {activeDistrict.providers.map((prov, idx) => (
                      <button
                        key={prov.id}
                        type="button"
                        onClick={() => setSelectedProviderIdx(idx)}
                        className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors truncate ${
                          idx === selectedProviderIdx
                            ? 'bg-[#0A0A0B] text-white'
                            : 'text-[#4A4A52] hover:text-[#0A0A0B]'
                        }`}
                      >
                        {prov.category.split('&')[0].trim()}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Provider Identity */}
              <div className="space-y-2 pb-5 border-b border-[#E5E5E0]">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#A8821B]">
                  {activeProvider.category}
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-semibold text-[#0A0A0B] leading-snug">
                  {activeProvider.name}
                </h3>
                <p className="text-sm text-[#4A4A52] leading-relaxed">{specialtyText}</p>
              </div>

              {/* Contact Coordinates */}
              <div className="space-y-3.5 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#C59B27] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-[#6B6B73]">Adresse</div>
                    <div className="font-medium text-[#0A0A0B]">{activeProvider.address}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[#C59B27] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-[#6B6B73]">Téléphone direct</div>
                    <a
                      href={`tel:${activeProvider.phone.replace(/\s+/g, '')}`}
                      className="font-medium text-[#0A0A0B] hover:text-[#A8821B] tabular-nums"
                    >
                      {activeProvider.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#C59B27] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-[#6B6B73]">Contact e-mail</div>
                    <a
                      href={`mailto:${activeProvider.email}`}
                      className="font-medium text-[#0A0A0B] hover:text-[#A8821B]"
                    >
                      {activeProvider.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-[#C59B27] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-[#6B6B73]">Disponibilité</div>
                    <div className="font-medium text-[#0A0A0B] tabular-nums">
                      {activeProvider.hours}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <div className="pt-4 border-t border-[#E5E5E0]">
              <button
                type="button"
                onClick={() =>
                  onNavigate('/reserver', {
                    category: activeProvider.bookingCategory,
                    serviceIds: [activeProvider.serviceId],
                  })
                }
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 text-xs sm:text-sm font-semibold bg-[#0A0A0B] text-white hover:bg-[#C59B27] hover:text-[#0A0A0B] transition-colors rounded-md"
              >
                <span>Réserver avec ce prestataire ({activeDistrict.name})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
