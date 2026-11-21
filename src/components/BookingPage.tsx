import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Calendar, CheckCircle2, Paperclip, ShieldCheck, Tag, X } from 'lucide-react';
import { formatMad, useI18n } from '../i18n.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import type { Booking, BookingPreselection, Category, ServiceItem } from '../types.ts';
import type { AppRoute } from './Navbar.tsx';

interface BookingPageProps {
  categories: Category[];
  services: ServiceItem[];
  preselection?: BookingPreselection;
  onClearOffer?: () => void;
  onNavigate: (route: AppRoute) => void;
}

interface AvailabilityResult {
  date: string;
  available: boolean;
  reason?: string;
  existingCount: number;
  maxBookingsPerDay: number;
  bookedTimes: string[];
}

export function BookingPage({
  categories,
  services,
  preselection,
  onClearOffer,
  onNavigate,
}: BookingPageProps) {
  const { t } = useI18n();
  const { apiFetch, user, profile } = useAuth();

  const eventCategories = useMemo(
    () => categories.filter((c) => c.group !== 'complementary'),
    [categories]
  );

  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [eventCategory, setEventCategory] = useState(
    preselection?.category || eventCategories[0]?.nameFr || 'Événements Privés'
  );
  const [eventType, setEventType] = useState(preselection?.eventType || 'Mariages');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('19:00');
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('Casablanca');
  const [guestCount, setGuestCount] = useState('120');
  const [budgetMad, setBudgetMad] = useState(
    preselection?.budgetMad ? String(preselection.budgetMad) : '80000'
  );
  const [description, setDescription] = useState(
    preselection?.offerTitle
      ? `Demande basée sur l'offre promotionnelle : ${preselection.offerTitle} (${preselection.offerPriceSummary || ''}).`
      : ''
  );
  const [selectedServices, setSelectedServices] = useState<string[]>(
    preselection?.serviceIds || []
  );
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [attachmentDataUrl, setAttachmentDataUrl] = useState<string | null>(null);

  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const [checkingDate, setCheckingDate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    booking: Booking;
    emailNotice: string;
  } | null>(null);

  useEffect(() => {
    if (profile?.fullName && !fullName) setFullName(profile.fullName);
    if (user?.email && !email) setEmail(user.email);
    if (profile?.phone && !phone) setPhone(profile.phone);
  }, [profile, user, fullName, email, phone]);

  const activeCategoryObj = useMemo(
    () => eventCategories.find((c) => c.nameFr === eventCategory) || eventCategories[0],
    [eventCategories, eventCategory]
  );

  useEffect(() => {
    if (activeCategoryObj && !activeCategoryObj.subtypes.includes(eventType)) {
      setEventType(activeCategoryObj.subtypes[0] || 'Événement sur mesure');
    }
  }, [activeCategoryObj, eventType]);

  useEffect(() => {
    if (!eventDate) {
      setAvailability(null);
      return;
    }
    let cancelled = false;
    setCheckingDate(true);
    fetch(`/api/availability?date=${encodeURIComponent(eventDate)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setAvailability(data);
      })
      .catch(() => {
        if (!cancelled) setAvailability(null);
      })
      .finally(() => {
        if (!cancelled) setCheckingDate(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eventDate]);

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const estimatedServicesTotal = useMemo(() => {
    return services
      .filter((s) => selectedServices.includes(s.id))
      .reduce((sum, s) => sum + s.unitPriceMad, 0);
  }, [services, selectedServices]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setAttachmentName(null);
      setAttachmentDataUrl(null);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Le fichier joint ne doit pas dépasser 2 Mo.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAttachmentName(file.name);
        setAttachmentDataUrl(reader.result);
        setErrorMsg(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const res = await apiFetch<{ booking: Booking; emailNotice: string }>('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          email,
          phone,
          eventCategory,
          eventType,
          eventDate,
          eventTime,
          venue,
          city,
          guestCount: Number(guestCount),
          budgetMad: Number(budgetMad),
          description,
          selectedServiceIds: selectedServices,
          attachmentName,
          attachmentDataUrl,
        }),
      });
      setConfirmation({ booking: res.booking, emailNotice: res.emailNotice });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de la réservation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmation) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="border border-[#E5E5E0] rounded-lg p-8 sm:p-10 bg-white space-y-6">
          <div className="flex items-center gap-3 text-[#0A0A0B]">
            <CheckCircle2 className="w-7 h-7 text-[#C59B27] shrink-0" />
            <h1 className="font-display text-3xl font-semibold">
              Demande de réservation enregistrée
            </h1>
          </div>

          <div className="p-5 bg-[#F6F6F4] rounded-md space-y-2">
            <div className="text-xs text-[#6B6B73]">Numéro unique de réservation</div>
            <div className="font-mono text-xl font-semibold text-[#0A0A0B] tabular-nums">
              {confirmation.booking.bookingNumber}
            </div>
            <div className="text-xs text-[#52525B]">{confirmation.emailNotice}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border-y border-[#E5E5E0] py-5">
            <div>
              <span className="text-xs text-[#6B6B73] block">Événement</span>
              <span className="font-medium text-[#0A0A0B]">
                {confirmation.booking.eventCategory} · {confirmation.booking.eventType}
              </span>
            </div>
            <div>
              <span className="text-xs text-[#6B6B73] block">Date &amp; Heure</span>
              <span className="font-medium text-[#0A0A0B] tabular-nums">
                {confirmation.booking.eventDate} à {confirmation.booking.eventTime}
              </span>
            </div>
            <div>
              <span className="text-xs text-[#6B6B73] block">Lieu</span>
              <span className="font-medium text-[#0A0A0B]">
                {confirmation.booking.venue}, {confirmation.booking.city}
              </span>
            </div>
            <div>
              <span className="text-xs text-[#6B6B73] block">Budget estimatif</span>
              <span className="font-medium text-[#0A0A0B] tabular-nums">
                {formatMad(confirmation.booking.budgetMad)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate('/espace-client')}
              className="px-5 py-2.5 text-sm font-semibold bg-[#0A0A0B] text-white hover:bg-[#C59B27] hover:text-[#0A0A0B] transition-colors rounded-md"
            >
              Suivre ma demande dans l’espace client
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmation(null);
                setDescription('');
              }}
              className="px-5 py-2.5 text-sm font-medium border border-[#E5E5E0] text-[#0A0A0B] hover:bg-[#F6F6F4] rounded-md"
            >
              Nouvelle demande
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F6F6F4] min-h-screen py-14">
      <div className="max-w-[1160px] mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mb-10 space-y-2">
          <h1 className="font-display text-4xl font-semibold text-[#0A0A0B]">
            {t.booking.title}
          </h1>
          <p className="text-sm sm:text-base text-[#52525B] leading-relaxed">
            {t.booking.subtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 bg-white border border-[#E5E5E0] rounded-lg p-6 sm:p-8 space-y-8">
            {preselection?.offerTitle && (
              <div className="p-4 border border-[#C59B27] bg-[#FBF7EC] rounded-md flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Tag className="w-4 h-4 text-[#A8821B] shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm text-[#0A0A0B] space-y-0.5">
                    <div className="font-semibold">
                      Offre Exclusive sélectionnée : {preselection.offerTitle}
                    </div>
                    {preselection.offerPriceSummary && (
                      <div className="text-xs text-[#4A4A52] tabular-nums">
                        Tarif appliqué : {preselection.offerPriceSummary}
                      </div>
                    )}
                  </div>
                </div>
                {onClearOffer && (
                  <button
                    type="button"
                    onClick={() => {
                      onClearOffer();
                      setSelectedServices([]);
                      setBudgetMad('80000');
                      setDescription('');
                    }}
                    className="p-1 text-[#6B6B73] hover:text-[#0A0A0B]"
                    aria-label="Retirer l'offre sélectionnée"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {errorMsg && (
              <div className="p-4 border border-red-300 bg-red-50 text-red-900 text-sm rounded-md flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-700" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. Coordonnées */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#0A0A0B] border-b border-[#E5E5E0] pb-2">
                01. Vos coordonnées
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#4A4A52] mb-1.5">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex : Yasmine El Amrani"
                    className="w-full px-3.5 py-2.5 text-sm border border-[#D8D8D2] rounded-md focus:outline-none focus:border-[#0A0A0B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A4A52] mb-1.5">
                    Adresse e-mail *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemple@domaine.ma"
                    className="w-full px-3.5 py-2.5 text-sm border border-[#D8D8D2] rounded-md focus:outline-none focus:border-[#0A0A0B]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#4A4A52] mb-1.5">
                    Téléphone marocain *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+212 6 00 00 00 00 ou 0600000000"
                    className="w-full px-3.5 py-2.5 text-sm border border-[#D8D8D2] rounded-md focus:outline-none focus:border-[#0A0A0B] tabular-nums"
                  />
                </div>
              </div>
            </div>

            {/* 2. Détails de l'événement */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#0A0A0B] border-b border-[#E5E5E0] pb-2">
                02. Caractéristiques de l’événement
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#4A4A52] mb-1.5">
                    Catégorie *
                  </label>
                  <select
                    value={eventCategory}
                    onChange={(e) => setEventCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-[#D8D8D2] rounded-md bg-white focus:outline-none focus:border-[#0A0A0B]"
                  >
                    {eventCategories.map((c) => (
                      <option key={c.id} value={c.nameFr}>
                        {c.nameFr}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A4A52] mb-1.5">
                    Type d’événement *
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-[#D8D8D2] rounded-md bg-white focus:outline-none focus:border-[#0A0A0B]"
                  >
                    {(activeCategoryObj?.subtypes || ['Sur mesure']).map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4A4A52] mb-1.5">
                    Date souhaitée *
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().slice(0, 10)}
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-[#D8D8D2] rounded-md focus:outline-none focus:border-[#0A0A0B] tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A4A52] mb-1.5">
                    Heure souhaitée *
                  </label>
                  <input
                    type="time"
                    required
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-[#D8D8D2] rounded-md focus:outline-none focus:border-[#0A0A0B] tabular-nums"
                  />
                </div>

                {eventDate && (
                  <div className="sm:col-span-2">
                    {checkingDate ? (
                      <div className="text-xs text-[#6B6B73] flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Vérification de disponibilité...</span>
                      </div>
                    ) : availability ? (
                      <div
                        className={`p-3 rounded-md text-xs flex items-center gap-2 ${
                          availability.available
                            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                            : 'bg-red-50 text-red-900 border border-red-200'
                        }`}
                      >
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span>
                          {availability.available
                            ? `Créneau disponible le ${availability.date} (${availability.existingCount}/${availability.maxBookingsPerDay} réservations enregistrées ce jour).`
                            : availability.reason}
                        </span>
                      </div>
                    ) : null}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-[#4A4A52] mb-1.5">
                    Adresse ou lieu *
                  </label>
                  <input
                    type="text"
                    required
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="Ex : Anfa, Corniche, ou à recommander"
                    className="w-full px-3.5 py-2.5 text-sm border border-[#D8D8D2] rounded-md focus:outline-none focus:border-[#0A0A0B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A4A52] mb-1.5">
                    Ville *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Casablanca"
                    className="w-full px-3.5 py-2.5 text-sm border border-[#D8D8D2] rounded-md focus:outline-none focus:border-[#0A0A0B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A4A52] mb-1.5">
                    Nombre d’invités *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50000"
                    required
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-[#D8D8D2] rounded-md focus:outline-none focus:border-[#0A0A0B] tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A4A52] mb-1.5">
                    Budget estimatif (DH / MAD) *
                  </label>
                  <input
                    type="number"
                    min="500"
                    step="500"
                    required
                    value={budgetMad}
                    onChange={(e) => setBudgetMad(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-[#D8D8D2] rounded-md focus:outline-none focus:border-[#0A0A0B] tabular-nums"
                  />
                </div>
              </div>
            </div>

            {/* 3. Prestations souhaitées */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#0A0A0B] border-b border-[#E5E5E0] pb-2">
                03. Services souhaités
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map((srv) => {
                  const checked = selectedServices.includes(srv.id);
                  return (
                    <label
                      key={srv.id}
                      className={`flex items-start gap-3 p-3.5 border rounded-md cursor-pointer transition-colors ${
                        checked
                          ? 'border-[#C59B27] bg-[#FBF7EC]'
                          : 'border-[#E5E5E0] hover:border-[#BDBDB5]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleService(srv.id)}
                        className="mt-1 accent-[#0A0A0B]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[#0A0A0B]">{srv.titleFr}</div>
                        <div className="text-xs text-[#6B6B73] tabular-nums mt-0.5">
                          À partir de {formatMad(srv.unitPriceMad)} · {srv.unitLabel}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 4. Description et pièce jointe */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#0A0A0B] border-b border-[#E5E5E0] pb-2">
                04. Description du projet &amp; Document
              </h2>
              <div>
                <label className="block text-xs font-medium text-[#4A4A52] mb-1.5">
                  Précisions complémentaires (thème, attentes techniques, contraintes)
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez votre vision, vos besoins spécifiques ou vos préférences de lieu..."
                  className="w-full px-3.5 py-2.5 text-sm border border-[#D8D8D2] rounded-md focus:outline-none focus:border-[#0A0A0B]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A4A52] mb-1.5">
                  Joindre un cahier des charges ou une inspiration (PDF, JPG, PNG · max 2 Mo)
                </label>
                <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium border border-[#D8D8D2] rounded-md cursor-pointer hover:bg-[#F6F6F4]">
                  <Paperclip className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>{attachmentName || 'Sélectionner un fichier'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <aside className="bg-[#0A0A0B] text-white rounded-lg p-6 sm:p-7 space-y-6 lg:sticky lg:top-24">
            <h3 className="font-display text-2xl font-semibold text-white">Récapitulatif</h3>
            <div className="space-y-3 text-sm border-y border-white/15 py-5">
              <div className="flex justify-between gap-2">
                <span className="text-white/65">Catégorie</span>
                <span className="font-medium text-right">{eventCategory}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-white/65">Format</span>
                <span className="font-medium text-right">{eventType}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-white/65">Date</span>
                <span className="font-medium tabular-nums">{eventDate || 'À définir'}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-white/65">Invités</span>
                <span className="font-medium tabular-nums">{guestCount || 0}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-white/65">Budget annoncé</span>
                <span className="font-medium tabular-nums text-[#E5C665]">
                  {formatMad(Number(budgetMad) || 0)}
                </span>
              </div>
              {estimatedServicesTotal > 0 && (
                <div className="flex justify-between gap-2 pt-2 border-t border-white/10">
                  <span className="text-white/65">Base prestations choisies</span>
                  <span className="font-medium tabular-nums">
                    {formatMad(estimatedServicesTotal)}
                  </span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || (availability !== null && !availability.available)}
              className="w-full py-3.5 px-5 text-sm font-semibold bg-[#C59B27] text-[#0A0A0B] hover:bg-[#D7AF3C] disabled:opacity-50 transition-colors rounded-md"
            >
              {submitting ? 'Enregistrement...' : t.booking.submitBtn}
            </button>

            <div className="flex items-start gap-2 text-xs text-white/60 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-[#C59B27] shrink-0 mt-0.5" />
              <span>
                Traitement sécurisé conforme à la loi marocaine 09-08 (CNDP). Aucun paiement n’est débité à cette étape.
              </span>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
