import React, { useMemo, useState } from 'react';
import { ArrowRight, Calendar, CheckCircle2, Mail, MapPin, Phone, Play, Users, X } from 'lucide-react';
import { formatMad } from '../i18n.tsx';
import type {
  Category,
  EventItem,
  GalleryCategory,
  GalleryItem,
  ServiceItem,
  SiteSettings,
} from '../types.ts';
import type { AppRoute } from './Navbar.tsx';
import { ResilientImage } from './ResilientImage.tsx';

export function EventsCatalogPage({
  categories,
  events,
  onNavigate,
}: {
  categories: Category[];
  events: EventItem[];
  onNavigate: (route: AppRoute, preselectCategory?: string) => void;
}) {
  return (
    <div className="py-16 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 space-y-16">
        <div className="max-w-2xl space-y-3">
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#0A0A0B]">
            Nos Événements à Casablanca &amp; au Maroc
          </h1>
          <p className="text-base text-[#52525B] leading-relaxed">
            Événements privés, conférences professionnelles et soirées festives orchestrés avec rigueur.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories
            .filter((c) => c.group !== 'complementary')
            .map((cat) => (
              <div
                key={cat.id}
                className="border border-[#E5E5E0] rounded-lg overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[4/3] bg-[#141417]">
                    <ResilientImage
                      src={cat.imageUrl}
                      alt={cat.nameFr}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 space-y-3">
                    <h2 className="font-display text-2xl font-semibold text-[#0A0A0B]">
                      {cat.nameFr}
                    </h2>
                    <p className="text-sm text-[#4A4A52]">{cat.descriptionFr}</p>
                    <p className="text-xs text-[#6B6B73]">{cat.subtypes.join(' · ')}</p>
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <button
                    type="button"
                    onClick={() => onNavigate('/reserver', cat.nameFr)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#0A0A0B] hover:text-[#A8821B]"
                  >
                    <span>Planifier ce type d’événement</span>
                    <ArrowRight className="w-4 h-4 text-[#C59B27]" />
                  </button>
                </div>
              </div>
            ))}
        </div>

        <div className="pt-10 border-t border-[#E5E5E0] space-y-8">
          <div>
            <h2 className="font-display text-3xl font-semibold text-[#0A0A0B]">
              Calendrier &amp; Formats Déployables
            </h2>
            <p className="text-sm text-[#52525B] mt-1">
              Les concepts présentés ci-dessous illustrent les configurations possibles et sont administrables depuis /admin.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {events.map((evt) => (
              <article key={evt.id} className="border border-[#E5E5E0] rounded-lg overflow-hidden">
                <div className="aspect-[4/3] bg-[#141417]">
                  <ResilientImage
                    src={evt.imageUrl}
                    alt={evt.titleFr}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 space-y-3">
                  <div className="text-xs text-[#6B6B73]">
                    {evt.category} · {evt.status}
                  </div>
                  <h3 className="font-display text-xl font-semibold text-[#0A0A0B]">
                    {evt.titleFr}
                  </h3>
                  <p className="text-sm text-[#4A4A52]">{evt.descriptionFr}</p>
                  <div className="text-xs text-[#52525B] space-y-1 pt-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#C59B27]" />
                      <span className="tabular-nums">{evt.eventDate} · {evt.eventTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#C59B27]" />
                      <span>{evt.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-[#C59B27]" />
                      <span className="tabular-nums">Capacité : {evt.capacity}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ServicesCatalogPage({
  services,
  onNavigate,
}: {
  services: ServiceItem[];
  onNavigate: (route: AppRoute) => void;
}) {
  return (
    <div className="py-16 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#0A0A0B]">
              Nos Services Complémentaires
            </h1>
            <p className="text-base text-[#52525B]">
              Des prestations modulaires tarifiées en Dirhams marocains (MAD), combinables dans votre devis personnalisé.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/reserver')}
            className="px-5 py-3 text-sm font-semibold bg-[#0A0A0B] text-white hover:bg-[#C59B27] hover:text-[#0A0A0B] transition-colors rounded-md whitespace-nowrap shrink-0"
          >
            Composer mon devis
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((srv) => (
            <article
              key={srv.id}
              className="border border-[#E5E5E0] rounded-lg overflow-hidden flex flex-col justify-between bg-white"
            >
              <div>
                <div className="aspect-[4/3] bg-[#141417]">
                  <ResilientImage
                    src={srv.imageUrl}
                    alt={srv.titleFr}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 space-y-2.5">
                  <div className="text-xs text-[#A8821B] font-medium tabular-nums">
                    À partir de {formatMad(srv.unitPriceMad)} · {srv.unitLabel}
                  </div>
                  <h2 className="font-display text-2xl font-semibold text-[#0A0A0B]">
                    {srv.titleFr}
                  </h2>
                  <p className="text-sm text-[#4A4A52] leading-relaxed">{srv.descriptionFr}</p>
                </div>
              </div>
              <div className="px-6 pb-6">
                <button
                  type="button"
                  onClick={() => onNavigate('/reserver')}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[#0A0A0B] hover:text-[#A8821B]"
                >
                  <span>Inclure dans une réservation</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C59B27]" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

const GALLERY_FILTERS: { id: 'all' | GalleryCategory; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'mariages', label: 'Mariages' },
  { id: 'anniversaires', label: 'Anniversaires' },
  { id: 'conferences', label: 'Conférences' },
  { id: 'decorations', label: 'Décorations' },
  { id: 'soirees', label: 'Soirées' },
  { id: 'concerts', label: 'Concerts' },
  { id: 'entreprise', label: "Événements d'entreprise" },
];

export function GalleryPage({ gallery }: { gallery: GalleryItem[] }) {
  const [filter, setFilter] = useState<'all' | GalleryCategory>('all');
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  const visibleItems = useMemo(
    () => (filter === 'all' ? gallery : gallery.filter((g) => g.category === filter)),
    [gallery, filter]
  );

  return (
    <div className="py-16 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 space-y-10">
        <div className="max-w-2xl space-y-3">
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#0A0A0B]">
            Galerie Photos &amp; Vidéos
          </h1>
          <p className="text-sm sm:text-base text-[#52525B]">
            Inspirations visuelles et mises en scène événementielles. Les visuels présentés servent d’illustration de style et sont modifiables depuis l’espace d’administration.
          </p>
        </div>

        {/* Interactive Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1.5 bg-[#F6F6F4] rounded-lg w-fit">
          {GALLERY_FILTERS.map((tab) => (
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

        {visibleItems.length === 0 ? (
          <div className="p-12 border border-[#E5E5E0] rounded-lg text-center text-sm text-[#6B6B73]">
            Aucun média dans cette catégorie pour le moment.
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
            {visibleItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLightboxItem(item)}
                className="group break-inside-avoid mb-6 block w-full text-left border border-[#E5E5E0] rounded-lg overflow-hidden bg-white hover:border-[#C59B27] transition-colors"
              >
                <div className="relative bg-[#141417] overflow-hidden">
                  <ResilientImage
                    src={item.thumbnailUrl || item.mediaUrl}
                    alt={item.titleFr}
                    className="w-full h-auto block object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  {item.mediaType === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                      <span className="w-12 h-12 rounded-full bg-[#C59B27] text-[#0A0A0B] flex items-center justify-center">
                        <Play className="w-5 h-5 fill-current" />
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-5 space-y-1.5">
                  <div className="text-xs text-[#A8821B] font-medium">
                    {item.category} · {item.mediaType === 'video' ? 'Vidéo' : 'Photo'}
                  </div>
                  <h2 className="font-display text-xl font-semibold text-[#0A0A0B]">
                    {item.titleFr}
                  </h2>
                  <p className="text-xs text-[#6B6B73] line-clamp-2">{item.captionFr}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Lightbox */}
        {lightboxItem && (
          <div
            className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white rounded-lg max-w-4xl w-full overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E5E0]">
                <div>
                  <div className="text-sm font-semibold text-[#0A0A0B]">{lightboxItem.titleFr}</div>
                  <div className="text-xs text-[#6B6B73]">{lightboxItem.captionFr}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setLightboxItem(null)}
                  className="p-2 text-[#4A4A52] hover:text-[#0A0A0B]"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="bg-[#0A0A0B] max-h-[75vh] flex items-center justify-center">
                {lightboxItem.mediaType === 'video' ? (
                  <video
                    src={lightboxItem.mediaUrl}
                    controls
                    className="max-h-[75vh] w-full"
                  />
                ) : (
                  <ResilientImage
                    src={lightboxItem.mediaUrl}
                    alt={lightboxItem.titleFr}
                    className="max-h-[75vh] w-auto object-contain"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AboutPage({
  settings,
  onNavigate,
}: {
  settings: SiteSettings;
  onNavigate: (route: AppRoute) => void;
}) {
  return (
    <div className="py-16 bg-white">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 space-y-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
          <div className="space-y-5 flex flex-col justify-center">
            <p className="text-xs font-medium text-[#A8821B]">Casablanca · Maroc</p>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#0A0A0B]">
              {settings.companyName} — {settings.sloganFr}
            </h1>
            <p className="text-base text-[#4A4A52] leading-relaxed">
              Basée à Casablanca, {settings.companyName} conçoit, coordonne et produit des événements privés, institutionnels et culturels à travers tout le Royaume du Maroc.
            </p>
            <p className="text-base text-[#4A4A52] leading-relaxed">
              Notre approche associe direction artistique exigeante, rigueur logistique, transparence budgétaire en Dirhams marocains (MAD) et suivi digitalisé via votre espace client dédié.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigate('/reserver')}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-[#0A0A0B] text-white hover:bg-[#C59B27] hover:text-[#0A0A0B] transition-colors rounded-md"
              >
                <span>Discuter de votre projet</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="rounded-lg overflow-hidden border border-[#E5E5E0] bg-[#141417]">
            <ResilientImage
              src="/src/assets/images/gallery_gala_dinner_1795276848851.jpg"
              alt="Équipe et réception EVENT PRO à Casablanca"
              className="w-full h-full object-cover min-h-[320px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContactPage({ settings }: { settings: SiteSettings }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, phone, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur envoi');
      setSent(true);
      setFullName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-16 bg-[#F6F6F4]">
      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <h1 className="font-display text-4xl font-semibold text-[#0A0A0B]">Contactez-nous</h1>
          <p className="text-sm sm:text-base text-[#52525B] leading-relaxed">
            Rencontrons-nous dans nos bureaux à Casablanca ou échangeons par téléphone pour étudier votre cahier des charges.
          </p>
          <div className="space-y-4 pt-2 text-sm text-[#111113]">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-[#C59B27] mt-1 shrink-0" />
              <span>{settings.address}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-[#C59B27] shrink-0" />
              <span className="tabular-nums">{settings.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-[#C59B27] shrink-0" />
              <span>{settings.email}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white border border-[#E5E5E0] rounded-lg p-6 sm:p-8">
          {sent ? (
            <div className="py-10 text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-[#C59B27] mx-auto" />
              <h2 className="font-display text-2xl font-semibold">Message transmis</h2>
              <p className="text-sm text-[#52525B]">
                Votre message a bien été enregistré. Un conseiller EVENT PRO vous répondra dans les plus brefs délais.
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="px-4 py-2 text-xs font-semibold border border-[#E5E5E0] rounded-md"
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-900 text-xs rounded">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#4A4A52] mb-1">Nom complet *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-[#D8D8D2] rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A4A52] mb-1">E-mail *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-[#D8D8D2] rounded-md"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#4A4A52] mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+212 6..."
                    className="w-full px-3.5 py-2.5 text-sm border border-[#D8D8D2] rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A4A52] mb-1">Objet</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-[#D8D8D2] rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4A4A52] mb-1">Message *</label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-[#D8D8D2] rounded-md"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 text-sm font-semibold bg-[#0A0A0B] text-white hover:bg-[#C59B27] hover:text-[#0A0A0B] transition-colors rounded-md"
              >
                {loading ? 'Envoi...' : 'Envoyer le message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function LegalPage({
  type,
  settings,
}: {
  type: 'mentions' | 'confidentialite' | 'cgu' | 'reservation';
  settings: SiteSettings;
}) {
  const titles = {
    mentions: 'Mentions Légales',
    confidentialite: 'Politique de Confidentialité & Protection des Données (Loi 09-08 / CNDP)',
    cgu: 'Conditions Générales d’Utilisation',
    reservation: 'Conditions de Réservation & Politique d’Annulation',
  };

  return (
    <div className="py-16 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
        <h1 className="font-display text-4xl font-semibold text-[#0A0A0B]">{titles[type]}</h1>
        <div className="space-y-4 text-sm text-[#4A4A52] leading-relaxed">
          {type === 'mentions' && (
            <>
              <p>
                Le présent site est édité par <strong>{settings.companyName}</strong>, agence d’organisation événementielle située à {settings.address}.
              </p>
              <p>
                Contact : {settings.email} · Téléphone : {settings.phone}.
              </p>
              <p>
                Les visuels de démonstration présentés dans la galerie ont pour objet d’illustrer l’univers esthétique proposé et sont gérés par l’administration de la plateforme.
              </p>
            </>
          )}
          {type === 'confidentialite' && (
            <>
              <p>
                Conformément à la <strong>loi marocaine n° 09-08</strong> relative à la protection des personnes physiques à l’égard du traitement des données à caractère personnel, et aux recommandations de la <strong>Commission Nationale de contrôle de la protection des Données à caractère Personnel (CNDP)</strong>, {settings.companyName} collecte et traite vos données exclusivement pour la gestion des demandes de réservation, l’établissement des devis, la facturation et le suivi client.
              </p>
              <p>
                <strong>Droits des personnes concernées :</strong> Vous disposez d’un droit d’accès, de rectification et d’opposition au traitement de vos données en écrivant à {settings.email}. Les factures émises restent archivées conformément aux obligations comptables et fiscales marocaines en vigueur, avec anonymisation des données personnelles sur demande lorsque cela est légalement applicable.
              </p>
              <p>
                <strong>Sécurité :</strong> Les mots de passe sont hachés cryptographiquement (scrypt), les accès sont strictement cloisonnés par rôle et les sessions utilisent des jetons signés en mémoire.
              </p>
            </>
          )}
          {type === 'cgu' && (
            <>
              <p>
                L’accès et l’utilisation de la plateforme {settings.companyName} impliquent l’acceptation pleine et entière des présentes conditions générales d’utilisation.
              </p>
              <p>
                L’utilisateur s’engage à fournir des informations exactes lors de toute demande de réservation ou création de compte client et à préserver la confidentialité de ses identifiants.
              </p>
            </>
          )}
          {type === 'reservation' && (
            <>
              <p>
                <strong>Devis &amp; Validité :</strong> Chaque demande de réservation donne lieu à une étude de disponibilité et à l’émission d’un devis personnalisé en Dirhams marocains (MAD) indiquant la durée de validité et le régime de TVA applicable.
              </p>
              <p>
                <strong>Confirmation &amp; Acompte :</strong> La réservation devient ferme après acceptation du devis et validation du règlement prévu selon les conditions mentionnées sur le devis.
              </p>
              <p>
                <strong>Annulation :</strong> Toute demande confirmée peut être annulée en ligne jusqu’à {settings.cancellationNoticeDays} jours avant la date de l’événement. En deçà de ce délai, veuillez contacter directement notre équipe au {settings.phone}.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
