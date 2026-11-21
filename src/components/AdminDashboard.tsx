import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Download,
  FileText,
  Image,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  Shield,
  Trash2,
  Users,
  Wallet,
} from 'lucide-react';
import { formatMad } from '../i18n.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { downloadInvoicePdf, downloadQuotePdf } from '../utils/pdf.ts';
import type {
  Booking,
  BookingStatus,
  Category,
  ContactMessage,
  EventItem,
  GalleryCategory,
  GalleryItem,
  Invoice,
  NotificationItem,
  Payment,
  PaymentStatus,
  Profile,
  Quote,
  QuoteItem,
  ServiceItem,
  SiteSettings,
  Testimonial,
} from '../types.ts';
import type { AppRoute } from './Navbar.tsx';

interface AdminDashboardProps {
  onBootstrapRefresh: () => Promise<void>;
  onNavigate: (route: AppRoute) => void;
}

interface AdminClientRow {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  profile: Profile | null;
  bookingCount: number;
}

interface AdminUserRow {
  id: string;
  email: string;
  role: 'admin' | 'manager';
  isActive: boolean;
  createdAt: string;
  fullName: string;
}

interface AdminOverviewData {
  kpis: {
    totalBookings: number;
    newRequests: number;
    confirmedBookings: number;
    upcomingEvents: number;
    recordedRevenueMad: number;
    pendingQuotes: number;
  };
  bookings: Booking[];
  clients: AdminClientRow[];
  adminUsers: AdminUserRow[];
  categories: Category[];
  services: ServiceItem[];
  events: EventItem[];
  quotes: Quote[];
  quoteItems: QuoteItem[];
  payments: Payment[];
  invoices: Invoice[];
  gallery: GalleryItem[];
  testimonials: Testimonial[];
  contactMessages: ContactMessage[];
  notifications: NotificationItem[];
  settings: SiteSettings;
}

type AdminSection =
  | 'dashboard'
  | 'bookings'
  | 'clients'
  | 'services'
  | 'events'
  | 'quotes'
  | 'content'
  | 'settings';

const BOOKING_STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: 'nouvelle_demande', label: 'Nouvelle demande' },
  { value: 'en_attente_confirmation', label: 'En attente de confirmation' },
  { value: 'devis_envoye', label: 'Devis envoyé' },
  { value: 'devis_accepte', label: 'Devis accepté' },
  { value: 'reservation_confirmee', label: 'Réservation confirmée' },
  { value: 'evenement_termine', label: 'Événement terminé' },
  { value: 'annulee', label: 'Annulée' },
];

export function AdminDashboard({ onBootstrapRefresh, onNavigate }: AdminDashboardProps) {
  const { isAdmin, user, apiFetch, setSession, logout } = useAuth();

  const [bootstrapStatus, setBootstrapStatus] = useState<{
    isClaimed: boolean;
    envPasscodeConfigured: boolean;
  } | null>(null);

  // Admin auth forms
  const [claimName, setClaimName] = useState('');
  const [claimEmail, setClaimEmail] = useState('');
  const [claimPass, setClaimPass] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginPasscode, setLoginPasscode] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Dashboard state
  const [section, setSection] = useState<AdminSection>('dashboard');
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Booking filters & selected detail
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('all');
  const [bookingCategoryFilter, setBookingCategoryFilter] = useState<string>('all');
  const [bookingDateFilter, setBookingDateFilter] = useState<string>('');
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  // Quote builder
  const [quoteBookingId, setQuoteBookingId] = useState<string>('');
  const [quoteItemsDraft, setQuoteItemsDraft] = useState<
    { serviceId: string | null; description: string; quantity: number; unitPriceMad: number }[]
  >([{ serviceId: null, description: 'Coordination & direction artistique', quantity: 1, unitPriceMad: 15000 }]);
  const [quoteDiscount, setQuoteDiscount] = useState('0');
  const [quoteVatRate, setQuoteVatRate] = useState('0');
  const [quoteTerms, setQuoteTerms] = useState(
    "Acompte de 30% à la validation du devis, solde 7 jours avant l'événement."
  );
  const [quoteValidUntil, setQuoteValidUntil] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [quoteNotes, setQuoteNotes] = useState('');

  // Service creation form
  const [srvTitle, setSrvTitle] = useState('');
  const [srvDesc, setSrvDesc] = useState('');
  const [srvPrice, setSrvPrice] = useState('5000');
  const [srvUnit, setSrvUnit] = useState('Forfait');
  const [srvImg, setSrvImg] = useState('');

  // Event creation form
  const [evtTitle, setEvtTitle] = useState('');
  const [evtCategory, setEvtCategory] = useState('Événements Professionnels');
  const [evtDate, setEvtDate] = useState('');
  const [evtTime, setEvtTime] = useState('19:00');
  const [evtVenue, setEvtVenue] = useState('');
  const [evtCapacity, setEvtCapacity] = useState('150');
  const [evtDesc, setEvtDesc] = useState('');

  // Gallery creation form
  const [galTitle, setGalTitle] = useState('');
  const [galCategory, setGalCategory] = useState<GalleryCategory>('soirees');
  const [galType, setGalType] = useState<'photo' | 'video'>('photo');
  const [galUrl, setGalUrl] = useState('');
  const [galCaption, setGalCaption] = useState('');

  // Testimonial creation form
  const [testAuthor, setTestAuthor] = useState('');
  const [testRole, setTestRole] = useState('');
  const [testCompany, setTestCompany] = useState('Casablanca');
  const [testEventType, setTestEventType] = useState('Séminaire');
  const [testQuote, setTestQuote] = useState('');

  // Settings draft
  const [settingsDraft, setSettingsDraft] = useState<SiteSettings | null>(null);
  const [newBlockedDate, setNewBlockedDate] = useState('');

  // New admin user form
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'manager'>('manager');

  useEffect(() => {
    fetch('/api/admin/bootstrap-status')
      .then((r) => r.json())
      .then((res) => setBootstrapStatus(res))
      .catch(() => setBootstrapStatus({ isClaimed: false, envPasscodeConfigured: false }));
  }, []);

  const loadOverview = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const res = await apiFetch<AdminOverviewData>('/api/admin/overview');
      setData(res);
      setSettingsDraft(res.settings);
      setQuoteVatRate(String(res.settings.vatRatePercent));
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Erreur de chargement administration.');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      loadOverview();
    }
  }, [isAdmin, loadOverview]);

  const handleClaimAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const res = await apiFetch<{
        token: string;
        user: { id: string; email: string; role: 'admin' };
        profile: Profile;
      }>('/api/admin/claim', {
        method: 'POST',
        body: JSON.stringify({
          fullName: claimName,
          email: claimEmail,
          password: claimPass,
        }),
      });
      setSession(res.token, res.user, res.profile);
      setBootstrapStatus({ isClaimed: true, envPasscodeConfigured: false });
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Impossible de créer le compte administrateur.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const res = await apiFetch<{
        token: string;
        user: { id: string; email: string; role: 'admin' | 'manager' };
        profile: Profile | null;
      }>('/api/auth/admin-login', {
        method: 'POST',
        body: JSON.stringify({
          email: loginEmail,
          password: loginPass,
          passcode: loginPasscode,
        }),
      });
      setSession(res.token, res.user, res.profile);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Identifiants administrateur invalides.');
    } finally {
      setAuthLoading(false);
    }
  };

  const filteredBookings = useMemo(() => {
    if (!data) return [];
    return data.bookings.filter((b) => {
      if (bookingStatusFilter !== 'all' && b.status !== bookingStatusFilter) return false;
      if (bookingCategoryFilter !== 'all' && b.eventCategory !== bookingCategoryFilter) return false;
      if (bookingDateFilter && b.eventDate !== bookingDateFilter) return false;
      return true;
    });
  }, [data, bookingStatusFilter, bookingCategoryFilter, bookingDateFilter]);

  const quoteSubtotal = useMemo(
    () => quoteItemsDraft.reduce((s, it) => s + Number(it.quantity) * Number(it.unitPriceMad), 0),
    [quoteItemsDraft]
  );
  const quoteDiscountNum = Math.min(quoteSubtotal, Math.max(0, Number(quoteDiscount) || 0));
  const quoteNetHt = Math.max(0, quoteSubtotal - quoteDiscountNum);
  const quoteVatNum = Math.round(quoteNetHt * ((Number(quoteVatRate) || 0) / 100) * 100) / 100;
  const quoteTotalTtc = Math.round((quoteNetHt + quoteVatNum) * 100) / 100;

  const showNotice = (msg: string) => {
    setToast(msg);
  };

  const handleSaveBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    try {
      await apiFetch(`/api/admin/bookings/${editingBooking.id}`, {
        method: 'PATCH',
        body: JSON.stringify(editingBooking),
      });
      setEditingBooking(null);
      showNotice('Réservation mise à jour.');
      await loadOverview();
    } catch (err) {
      showNotice(err instanceof Error ? err.message : 'Erreur sauvegarde réservation.');
    }
  };

  const handleCreateQuote = async (sendImmediately: boolean) => {
    if (!quoteBookingId) {
      showNotice('Veuillez sélectionner une réservation cible.');
      return;
    }
    try {
      await apiFetch('/api/admin/quotes', {
        method: 'POST',
        body: JSON.stringify({
          bookingId: quoteBookingId,
          items: quoteItemsDraft,
          discountMad: Number(quoteDiscount) || 0,
          vatRatePercent: Number(quoteVatRate) || 0,
          paymentTerms: quoteTerms,
          validUntil: quoteValidUntil,
          notes: quoteNotes,
          sendImmediately,
        }),
      });
      showNotice(sendImmediately ? 'Devis émis et transmis au client.' : 'Devis enregistré en brouillon.');
      await loadOverview();
    } catch (err) {
      showNotice(err instanceof Error ? err.message : 'Erreur création devis.');
    }
  };

  const handleUpdatePaymentStatus = async (paymentId: string, status: PaymentStatus) => {
    try {
      await apiFetch(`/api/admin/payments/${paymentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      showNotice('Statut de paiement mis à jour.');
      await loadOverview();
    } catch (err) {
      showNotice(err instanceof Error ? err.message : 'Erreur paiement.');
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/admin/services', {
        method: 'POST',
        body: JSON.stringify({
          titleFr: srvTitle,
          descriptionFr: srvDesc,
          unitPriceMad: Number(srvPrice),
          unitLabel: srvUnit,
          imageUrl: srvImg,
        }),
      });
      setSrvTitle('');
      setSrvDesc('');
      setSrvImg('');
      showNotice('Service ajouté au catalogue.');
      await loadOverview();
      await onBootstrapRefresh();
    } catch (err) {
      showNotice(err instanceof Error ? err.message : 'Erreur ajout service.');
    }
  };

  const handleToggleService = async (srv: ServiceItem) => {
    await apiFetch(`/api/admin/services/${srv.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !srv.isActive }),
    });
    await loadOverview();
    await onBootstrapRefresh();
  };

  const handleDeleteService = async (id: string) => {
    await apiFetch(`/api/admin/services/${id}`, { method: 'DELETE' });
    await loadOverview();
    await onBootstrapRefresh();
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/admin/events', {
        method: 'POST',
        body: JSON.stringify({
          titleFr: evtTitle,
          category: evtCategory,
          eventDate: evtDate,
          eventTime: evtTime,
          venue: evtVenue,
          capacity: Number(evtCapacity),
          descriptionFr: evtDesc,
        }),
      });
      setEvtTitle('');
      setEvtVenue('');
      setEvtDesc('');
      showNotice('Événement créé.');
      await loadOverview();
      await onBootstrapRefresh();
    } catch (err) {
      showNotice(err instanceof Error ? err.message : 'Erreur création événement.');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    await apiFetch(`/api/admin/events/${id}`, { method: 'DELETE' });
    await loadOverview();
    await onBootstrapRefresh();
  };

  const handleAddGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/admin/gallery', {
        method: 'POST',
        body: JSON.stringify({
          titleFr: galTitle,
          category: galCategory,
          mediaType: galType,
          mediaUrl: galUrl,
          captionFr: galCaption,
        }),
      });
      setGalTitle('');
      setGalUrl('');
      setGalCaption('');
      showNotice('Média ajouté à la galerie.');
      await loadOverview();
      await onBootstrapRefresh();
    } catch (err) {
      showNotice(err instanceof Error ? err.message : 'Erreur ajout galerie.');
    }
  };

  const handleDeleteGalleryItem = async (id: string) => {
    await apiFetch(`/api/admin/gallery/${id}`, { method: 'DELETE' });
    await loadOverview();
    await onBootstrapRefresh();
  };

  const handleAddTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/admin/testimonials', {
        method: 'POST',
        body: JSON.stringify({
          authorName: testAuthor,
          authorRole: testRole,
          companyOrCity: testCompany,
          eventType: testEventType,
          quoteFr: testQuote,
        }),
      });
      setTestAuthor('');
      setTestRole('');
      setTestQuote('');
      showNotice('Témoignage ajouté.');
      await loadOverview();
      await onBootstrapRefresh();
    } catch (err) {
      showNotice(err instanceof Error ? err.message : 'Erreur ajout témoignage.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsDraft) return;
    try {
      await apiFetch('/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify(settingsDraft),
      });
      showNotice('Paramètres et contenus enregistrés.');
      await loadOverview();
      await onBootstrapRefresh();
    } catch (err) {
      showNotice(err instanceof Error ? err.message : 'Erreur enregistrement paramètres.');
    }
  };

  const handleCreateAdminUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          fullName: newAdminName,
          email: newAdminEmail,
          password: newAdminPass,
          role: newAdminRole,
        }),
      });
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPass('');
      showNotice('Utilisateur administrateur créé.');
      await loadOverview();
    } catch (err) {
      showNotice(err instanceof Error ? err.message : 'Erreur création utilisateur.');
    }
  };

  // Unauthenticated / First-Run Setup Gate
  if (!isAdmin) {
    const showFirstRunClaim =
      bootstrapStatus && !bootstrapStatus.isClaimed && !bootstrapStatus.envPasscodeConfigured;

    return (
      <div className="min-h-[80vh] bg-[#0A0A0B] text-white py-16 px-4">
        <div className="max-w-md mx-auto bg-[#141417] border border-white/15 rounded-lg p-7 sm:p-8 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-[#C59B27]">
              <Shield className="w-4 h-4" />
              <span>Accès protégé · /admin</span>
            </div>
            <h1 className="font-display text-3xl font-semibold text-white">
              {showFirstRunClaim
                ? 'Initialisation Administrateur'
                : 'Connexion Administration'}
            </h1>
            <p className="text-xs text-white/65 leading-relaxed">
              {showFirstRunClaim
                ? 'Aucun compte administrateur principal n’est encore configuré. Définissez le premier accès sécurisé pour verrouiller l’administration.'
                : 'Authentifiez-vous pour accéder à la gestion des réservations, devis, paiements et contenus.'}
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-red-950/60 border border-red-400/40 text-red-200 text-xs rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {showFirstRunClaim ? (
            <form onSubmit={handleClaimAdmin} className="space-y-4">
              <div>
                <label className="block text-xs text-white/75 mb-1">Nom complet</label>
                <input
                  type="text"
                  required
                  value={claimName}
                  onChange={(e) => setClaimName(e.target.value)}
                  placeholder="Direction EVENT PRO"
                  className="w-full px-3.5 py-2.5 text-sm bg-white/5 border border-white/20 rounded-md text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-white/75 mb-1">E-mail administrateur</label>
                <input
                  type="email"
                  required
                  value={claimEmail}
                  onChange={(e) => setClaimEmail(e.target.value)}
                  placeholder="admin@eventpro.ma"
                  className="w-full px-3.5 py-2.5 text-sm bg-white/5 border border-white/20 rounded-md text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-white/75 mb-1">
                  Mot de passe fort (min. 10 caractères)
                </label>
                <input
                  type="password"
                  required
                  minLength={10}
                  value={claimPass}
                  onChange={(e) => setClaimPass(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white/5 border border-white/20 rounded-md text-white"
                />
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 text-sm font-semibold bg-[#C59B27] text-[#0A0A0B] hover:bg-[#D7AF3C] rounded-md"
              >
                {authLoading ? 'Activation...' : 'Créer le compte administrateur principal'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              {bootstrapStatus?.envPasscodeConfigured ? (
                <div>
                  <label className="block text-xs text-white/75 mb-1">
                    Code d’accès administrateur (ADMIN_PASSCODE)
                  </label>
                  <input
                    type="password"
                    value={loginPasscode}
                    onChange={(e) => setLoginPasscode(e.target.value)}
                    placeholder="Saisissez le code configuré"
                    className="w-full px-3.5 py-2.5 text-sm bg-white/5 border border-white/20 rounded-md text-white"
                  />
                </div>
              ) : null}

              <div>
                <label className="block text-xs text-white/75 mb-1">E-mail administrateur</label>
                <input
                  type="email"
                  required={!loginPasscode}
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white/5 border border-white/20 rounded-md text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-white/75 mb-1">Mot de passe</label>
                <input
                  type="password"
                  required={!loginPasscode}
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white/5 border border-white/20 rounded-md text-white"
                />
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 text-sm font-semibold bg-[#C59B27] text-[#0A0A0B] hover:bg-[#D7AF3C] rounded-md"
              >
                {authLoading ? 'Vérification...' : 'Accéder au tableau de bord'}
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="w-full text-center text-xs text-white/60 hover:text-white"
          >
            Retour au site public
          </button>
        </div>
      </div>
    );
  }

  const navButtons: { id: AdminSection; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'bookings', label: 'Réservations', icon: <Calendar className="w-4 h-4" /> },
    { id: 'clients', label: 'Clients', icon: <Users className="w-4 h-4" /> },
    { id: 'services', label: 'Services', icon: <FileText className="w-4 h-4" /> },
    { id: 'events', label: 'Événements', icon: <Calendar className="w-4 h-4" /> },
    { id: 'quotes', label: 'Devis & Paiements', icon: <Wallet className="w-4 h-4" /> },
    { id: 'content', label: 'Contenu & Galerie', icon: <Image className="w-4 h-4" /> },
    { id: 'settings', label: 'Paramètres', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#F6F6F4] flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="lg:w-64 bg-[#0A0A0B] text-white shrink-0 border-r border-white/10">
        <div className="p-5 border-b border-white/10">
          <div className="font-display text-xl font-semibold text-white">EVENT PRO Admin</div>
          <div className="text-xs text-white/55 truncate mt-0.5">{user?.email}</div>
        </div>
        <nav className="p-3 flex lg:flex-col gap-1 overflow-x-auto">
          {navButtons.map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setSection(btn.id)}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                section === btn.id
                  ? 'bg-[#C59B27] text-[#0A0A0B] font-semibold'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
              }`}
            >
              {btn.icon}
              <span>{btn.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 mt-auto border-t border-white/10">
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-white/70 hover:text-white"
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-5 sm:p-8 space-y-6 overflow-x-hidden">
        {toast && (
          <div className="p-3.5 bg-white border border-[#C59B27] rounded-md text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#C59B27]" />
              <span>{toast}</span>
            </div>
            <button type="button" onClick={() => setToast(null)} className="text-[#6B6B73]">
              Fermer
            </button>
          </div>
        )}

        {loading && !data ? (
          <div className="p-12 bg-white border border-[#E5E5E0] rounded-lg text-center text-sm text-[#6B6B73]">
            Chargement des données d’administration...
          </div>
        ) : data ? (
          <>
            {/* A. DASHBOARD */}
            {section === 'dashboard' && (
              <div className="space-y-8">
                <h1 className="font-display text-3xl font-semibold text-[#0A0A0B]">
                  Vue d’ensemble de l’activité
                </h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="bg-white border border-[#E5E5E0] rounded-lg p-5">
                    <div className="text-xs text-[#6B6B73]">Total réservations</div>
                    <div className="text-3xl font-semibold text-[#0A0A0B] tabular-nums mt-1">
                      {data.kpis.totalBookings}
                    </div>
                  </div>
                  <div className="bg-white border border-[#E5E5E0] rounded-lg p-5">
                    <div className="text-xs text-[#6B6B73]">Nouvelles demandes</div>
                    <div className="text-3xl font-semibold text-[#A8821B] tabular-nums mt-1">
                      {data.kpis.newRequests}
                    </div>
                  </div>
                  <div className="bg-white border border-[#E5E5E0] rounded-lg p-5">
                    <div className="text-xs text-[#6B6B73]">Réservations confirmées</div>
                    <div className="text-3xl font-semibold text-emerald-700 tabular-nums mt-1">
                      {data.kpis.confirmedBookings}
                    </div>
                  </div>
                  <div className="bg-white border border-[#E5E5E0] rounded-lg p-5">
                    <div className="text-xs text-[#6B6B73]">Événements à venir</div>
                    <div className="text-3xl font-semibold text-[#0A0A0B] tabular-nums mt-1">
                      {data.kpis.upcomingEvents}
                    </div>
                  </div>
                  <div className="bg-white border border-[#E5E5E0] rounded-lg p-5">
                    <div className="text-xs text-[#6B6B73]">Chiffre d’affaires validé</div>
                    <div className="text-3xl font-semibold text-[#0A0A0B] tabular-nums mt-1">
                      {formatMad(data.kpis.recordedRevenueMad)}
                    </div>
                  </div>
                  <div className="bg-white border border-[#E5E5E0] rounded-lg p-5">
                    <div className="text-xs text-[#6B6B73]">Devis en attente</div>
                    <div className="text-3xl font-semibold text-[#0A0A0B] tabular-nums mt-1">
                      {data.kpis.pendingQuotes}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-[#E5E5E0] rounded-lg p-5 space-y-3">
                    <h2 className="text-sm font-semibold text-[#0A0A0B]">Dernières activités</h2>
                    {data.notifications.length === 0 ? (
                      <p className="text-xs text-[#6B6B73]">Aucune activité récente.</p>
                    ) : (
                      <div className="divide-y divide-[#E5E5E0] max-h-72 overflow-y-auto">
                        {data.notifications.slice(0, 10).map((n) => (
                          <div key={n.id} className="py-2.5 text-xs space-y-0.5">
                            <div className="font-medium text-[#0A0A0B]">{n.title}</div>
                            <div className="text-[#52525B]">{n.message}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-[#E5E5E0] rounded-lg p-5 space-y-3">
                    <h2 className="text-sm font-semibold text-[#0A0A0B]">
                      Messages de contact ({data.contactMessages.length})
                    </h2>
                    {data.contactMessages.length === 0 ? (
                      <p className="text-xs text-[#6B6B73]">Aucun message reçu.</p>
                    ) : (
                      <div className="divide-y divide-[#E5E5E0] max-h-72 overflow-y-auto">
                        {data.contactMessages.map((m) => (
                          <div key={m.id} className="py-2.5 text-xs space-y-1">
                            <div className="flex justify-between font-medium text-[#0A0A0B]">
                              <span>{m.fullName} · {m.subject}</span>
                              <span className="text-[#6B6B73]">{m.status}</span>
                            </div>
                            <p className="text-[#52525B]">{m.message}</p>
                            <div className="text-[#6B6B73]">{m.email} · {m.phone}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* B. BOOKINGS */}
            {section === 'bookings' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h1 className="font-display text-3xl font-semibold text-[#0A0A0B]">
                    Gestion des Réservations
                  </h1>
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={bookingStatusFilter}
                      onChange={(e) => setBookingStatusFilter(e.target.value)}
                      className="px-3 py-2 text-xs border border-[#D8D8D2] rounded-md bg-white"
                    >
                      <option value="all">Tous les statuts</option>
                      {BOOKING_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={bookingCategoryFilter}
                      onChange={(e) => setBookingCategoryFilter(e.target.value)}
                      className="px-3 py-2 text-xs border border-[#D8D8D2] rounded-md bg-white"
                    >
                      <option value="all">Toutes catégories</option>
                      {data.categories
                        .filter((c) => c.group !== 'complementary')
                        .map((c) => (
                          <option key={c.id} value={c.nameFr}>
                            {c.nameFr}
                          </option>
                        ))}
                    </select>
                    <input
                      type="date"
                      value={bookingDateFilter}
                      onChange={(e) => setBookingDateFilter(e.target.value)}
                      className="px-3 py-2 text-xs border border-[#D8D8D2] rounded-md bg-white"
                    />
                  </div>
                </div>

                <div className="bg-white border border-[#E5E5E0] rounded-lg overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E5E5E0] bg-[#F6F6F4] text-[#52525B]">
                        <th className="p-3.5">N° Dossier</th>
                        <th className="p-3.5">Client</th>
                        <th className="p-3.5">Événement</th>
                        <th className="p-3.5">Date</th>
                        <th className="p-3.5 text-right">Budget</th>
                        <th className="p-3.5">Statut</th>
                        <th className="p-3.5">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E0]">
                      {filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-[#6B6B73]">
                            Aucune réservation trouvée.
                          </td>
                        </tr>
                      ) : (
                        filteredBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-[#F6F6F4]/60">
                            <td className="p-3.5 font-mono font-medium">{b.bookingNumber}</td>
                            <td className="p-3.5">
                              <div className="font-medium text-[#0A0A0B]">{b.fullName}</div>
                              <div className="text-[#6B6B73]">{b.phone}</div>
                            </td>
                            <td className="p-3.5">
                              <div>{b.eventType}</div>
                              <div className="text-[#6B6B73]">{b.venue} ({b.guestCount} inv.)</div>
                            </td>
                            <td className="p-3.5 tabular-nums">
                              {b.eventDate} · {b.eventTime}
                            </td>
                            <td className="p-3.5 text-right tabular-nums font-medium">
                              {formatMad(b.budgetMad)}
                            </td>
                            <td className="p-3.5">{b.status.replace(/_/g, ' ')}</td>
                            <td className="p-3.5 space-x-2 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setEditingBooking(b)}
                                className="px-2.5 py-1 border border-[#D8D8D2] rounded hover:bg-[#F6F6F4]"
                              >
                                Gérer
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setQuoteBookingId(b.id);
                                  setSection('quotes');
                                }}
                                className="px-2.5 py-1 bg-[#0A0A0B] text-white rounded"
                              >
                                Devis
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {editingBooking && (
                  <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <form
                      onSubmit={handleSaveBooking}
                      className="bg-white rounded-lg max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
                    >
                      <h2 className="font-display text-2xl font-semibold">
                        Dossier {editingBooking.bookingNumber}
                      </h2>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[#52525B] mb-1">Statut</label>
                          <select
                            value={editingBooking.status}
                            onChange={(e) =>
                              setEditingBooking({
                                ...editingBooking,
                                status: e.target.value as BookingStatus,
                              })
                            }
                            className="w-full px-3 py-2 border border-[#D8D8D2] rounded bg-white"
                          >
                            {BOOKING_STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[#52525B] mb-1">Responsable affecté</label>
                          <input
                            type="text"
                            value={editingBooking.assignedManager || ''}
                            onChange={(e) =>
                              setEditingBooking({
                                ...editingBooking,
                                assignedManager: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-[#D8D8D2] rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-[#52525B] mb-1">Date</label>
                          <input
                            type="date"
                            value={editingBooking.eventDate}
                            onChange={(e) =>
                              setEditingBooking({ ...editingBooking, eventDate: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-[#D8D8D2] rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-[#52525B] mb-1">Heure</label>
                          <input
                            type="time"
                            value={editingBooking.eventTime}
                            onChange={(e) =>
                              setEditingBooking({ ...editingBooking, eventTime: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-[#D8D8D2] rounded"
                          />
                        </div>
                      </div>
                      <div className="text-xs">
                        <label className="block text-[#52525B] mb-1">Commentaires internes</label>
                        <textarea
                          rows={3}
                          value={editingBooking.internalNotes}
                          onChange={(e) =>
                            setEditingBooking({
                              ...editingBooking,
                              internalNotes: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-[#D8D8D2] rounded"
                        />
                      </div>
                      <div className="text-xs bg-[#F6F6F4] p-3 rounded space-y-1">
                        <div><strong>Client :</strong> {editingBooking.fullName} ({editingBooking.email})</div>
                        <div><strong>Description :</strong> {editingBooking.description || '—'}</div>
                        {editingBooking.attachmentName && (
                          <div><strong>Pièce jointe :</strong> {editingBooking.attachmentName}</div>
                        )}
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingBooking(null)}
                          className="px-4 py-2 text-xs border border-[#E5E5E0] rounded"
                        >
                          Fermer
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-xs font-semibold bg-[#0A0A0B] text-white rounded"
                        >
                          Enregistrer
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* C. CLIENTS */}
            {section === 'clients' && (
              <div className="space-y-6">
                <h1 className="font-display text-3xl font-semibold text-[#0A0A0B]">
                  Gestion des Clients
                </h1>
                <div className="bg-white border border-[#E5E5E0] rounded-lg overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E5E5E0] bg-[#F6F6F4] text-[#52525B]">
                        <th className="p-3.5">Nom</th>
                        <th className="p-3.5">E-mail</th>
                        <th className="p-3.5">Téléphone</th>
                        <th className="p-3.5">Ville</th>
                        <th className="p-3.5 text-right">Réservations</th>
                        <th className="p-3.5">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E0]">
                      {data.clients.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-[#6B6B73]">
                            Aucun compte client inscrit pour le moment.
                          </td>
                        </tr>
                      ) : (
                        data.clients.map((c) => (
                          <tr key={c.id}>
                            <td className="p-3.5 font-medium">{c.profile?.fullName || '—'}</td>
                            <td className="p-3.5">{c.email}</td>
                            <td className="p-3.5 tabular-nums">{c.profile?.phone || '—'}</td>
                            <td className="p-3.5">{c.profile?.city || '—'}</td>
                            <td className="p-3.5 text-right tabular-nums">{c.bookingCount}</td>
                            <td className="p-3.5 space-x-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  await apiFetch(`/api/admin/clients/${c.id}`, {
                                    method: 'PATCH',
                                    body: JSON.stringify({ isActive: !c.isActive }),
                                  });
                                  await loadOverview();
                                }}
                                className="px-2.5 py-1 border border-[#D8D8D2] rounded"
                              >
                                {c.isActive ? 'Désactiver' : 'Réactiver'}
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await apiFetch(`/api/admin/clients/${c.id}`, {
                                      method: 'DELETE',
                                    });
                                    showNotice('Client supprimé / anonymisé conformément à la loi 09-08.');
                                    await loadOverview();
                                  } catch (err) {
                                    showNotice(err instanceof Error ? err.message : 'Action refusée.');
                                  }
                                }}
                                className="px-2.5 py-1 border border-red-200 text-red-700 rounded"
                              >
                                Supprimer
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* D. SERVICES */}
            {section === 'services' && (
              <div className="space-y-6">
                <h1 className="font-display text-3xl font-semibold text-[#0A0A0B]">
                  Catalogue des Services
                </h1>
                <form
                  onSubmit={handleAddService}
                  className="bg-white border border-[#E5E5E0] rounded-lg p-5 grid grid-cols-1 md:grid-cols-5 gap-3 items-end"
                >
                  <div>
                    <label className="block text-xs text-[#52525B] mb-1">Titre *</label>
                    <input
                      type="text"
                      required
                      value={srvTitle}
                      onChange={(e) => setSrvTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#D8D8D2] rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#52525B] mb-1">Tarif (MAD) *</label>
                    <input
                      type="number"
                      required
                      value={srvPrice}
                      onChange={(e) => setSrvPrice(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#D8D8D2] rounded tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#52525B] mb-1">Unité</label>
                    <input
                      type="text"
                      value={srvUnit}
                      onChange={(e) => setSrvUnit(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#D8D8D2] rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#52525B] mb-1">Description</label>
                    <input
                      type="text"
                      value={srvDesc}
                      onChange={(e) => setSrvDesc(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#D8D8D2] rounded"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-[#0A0A0B] text-white rounded inline-flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter</span>
                  </button>
                </form>

                <div className="bg-white border border-[#E5E5E0] rounded-lg divide-y divide-[#E5E5E0]">
                  {data.services.map((s) => (
                    <div
                      key={s.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-[#0A0A0B]">{s.titleFr}</div>
                        <div className="text-[#6B6B73]">
                          {formatMad(s.unitPriceMad)} · {s.unitLabel} ·{' '}
                          {s.isActive ? 'Actif' : 'Désactivé'}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleService(s)}
                          className="px-3 py-1.5 border border-[#D8D8D2] rounded"
                        >
                          {s.isActive ? 'Désactiver' : 'Activer'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteService(s.id)}
                          className="px-3 py-1.5 border border-red-200 text-red-700 rounded"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* E. EVENTS */}
            {section === 'events' && (
              <div className="space-y-6">
                <h1 className="font-display text-3xl font-semibold text-[#0A0A0B]">
                  Gestion des Événements
                </h1>
                <form
                  onSubmit={handleAddEvent}
                  className="bg-white border border-[#E5E5E0] rounded-lg p-5 grid grid-cols-1 md:grid-cols-3 gap-3"
                >
                  <input
                    type="text"
                    required
                    placeholder="Titre de l'événement *"
                    value={evtTitle}
                    onChange={(e) => setEvtTitle(e.target.value)}
                    className="px-3 py-2 text-xs border border-[#D8D8D2] rounded"
                  />
                  <input
                    type="text"
                    placeholder="Catégorie"
                    value={evtCategory}
                    onChange={(e) => setEvtCategory(e.target.value)}
                    className="px-3 py-2 text-xs border border-[#D8D8D2] rounded"
                  />
                  <input
                    type="date"
                    required
                    value={evtDate}
                    onChange={(e) => setEvtDate(e.target.value)}
                    className="px-3 py-2 text-xs border border-[#D8D8D2] rounded"
                  />
                  <input
                    type="time"
                    value={evtTime}
                    onChange={(e) => setEvtTime(e.target.value)}
                    className="px-3 py-2 text-xs border border-[#D8D8D2] rounded"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Lieu / Salle *"
                    value={evtVenue}
                    onChange={(e) => setEvtVenue(e.target.value)}
                    className="px-3 py-2 text-xs border border-[#D8D8D2] rounded"
                  />
                  <input
                    type="number"
                    placeholder="Capacité"
                    value={evtCapacity}
                    onChange={(e) => setEvtCapacity(e.target.value)}
                    className="px-3 py-2 text-xs border border-[#D8D8D2] rounded"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={evtDesc}
                    onChange={(e) => setEvtDesc(e.target.value)}
                    className="md:col-span-2 px-3 py-2 text-xs border border-[#D8D8D2] rounded"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-[#0A0A0B] text-white rounded"
                  >
                    Créer l’événement
                  </button>
                </form>

                <div className="bg-white border border-[#E5E5E0] rounded-lg divide-y divide-[#E5E5E0]">
                  {data.events.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-[#0A0A0B]">{ev.titleFr}</div>
                        <div className="text-[#6B6B73] tabular-nums">
                          {ev.eventDate} · {ev.eventTime} · {ev.venue} · Capacité : {ev.capacity}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="px-3 py-1.5 border border-red-200 text-red-700 rounded w-fit"
                      >
                        Supprimer
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* F. QUOTES, INVOICES & PAYMENTS */}
            {section === 'quotes' && (
              <div className="space-y-8">
                <h1 className="font-display text-3xl font-semibold text-[#0A0A0B]">
                  Devis, Factures &amp; Paiements
                </h1>

                {/* Quote Builder */}
                <div className="bg-white border border-[#E5E5E0] rounded-lg p-6 space-y-5">
                  <h2 className="text-base font-semibold text-[#0A0A0B]">Créer un Devis</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block text-[#52525B] mb-1">Réservation associée *</label>
                      <select
                        value={quoteBookingId}
                        onChange={(e) => setQuoteBookingId(e.target.value)}
                        className="w-full px-3 py-2 border border-[#D8D8D2] rounded bg-white"
                      >
                        <option value="">-- Choisir une réservation --</option>
                        {data.bookings.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.bookingNumber} — {b.fullName} ({b.eventType})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[#52525B] mb-1">Valide jusqu’au</label>
                      <input
                        type="date"
                        value={quoteValidUntil}
                        onChange={(e) => setQuoteValidUntil(e.target.value)}
                        className="w-full px-3 py-2 border border-[#D8D8D2] rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[#52525B] mb-1">
                        TVA configurable (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        step="0.5"
                        value={quoteVatRate}
                        onChange={(e) => setQuoteVatRate(e.target.value)}
                        className="w-full px-3 py-2 border border-[#D8D8D2] rounded tabular-nums"
                      />
                    </div>
                  </div>

                  {/* Line items */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-[#52525B]">Lignes de prestations</div>
                    {quoteItemsDraft.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs">
                        <input
                          type="text"
                          placeholder="Désignation"
                          value={item.description}
                          onChange={(e) => {
                            const copy = [...quoteItemsDraft];
                            copy[idx].description = e.target.value;
                            setQuoteItemsDraft(copy);
                          }}
                          className="col-span-12 sm:col-span-6 px-3 py-2 border border-[#D8D8D2] rounded"
                        />
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const copy = [...quoteItemsDraft];
                            copy[idx].quantity = Number(e.target.value) || 1;
                            setQuoteItemsDraft(copy);
                          }}
                          className="col-span-4 sm:col-span-2 px-3 py-2 border border-[#D8D8D2] rounded tabular-nums"
                        />
                        <input
                          type="number"
                          min="0"
                          value={item.unitPriceMad}
                          onChange={(e) => {
                            const copy = [...quoteItemsDraft];
                            copy[idx].unitPriceMad = Number(e.target.value) || 0;
                            setQuoteItemsDraft(copy);
                          }}
                          className="col-span-6 sm:col-span-3 px-3 py-2 border border-[#D8D8D2] rounded tabular-nums"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setQuoteItemsDraft((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="col-span-2 sm:col-span-1 p-2 text-red-700 hover:bg-red-50 rounded"
                          aria-label="Retirer ligne"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setQuoteItemsDraft((prev) => [
                            ...prev,
                            { serviceId: null, description: '', quantity: 1, unitPriceMad: 0 },
                          ])
                        }
                        className="px-3 py-1.5 text-xs border border-[#D8D8D2] rounded"
                      >
                        + Ligne libre
                      </button>
                      <select
                        value=""
                        onChange={(e) => {
                          const srv = data.services.find((s) => s.id === e.target.value);
                          if (srv) {
                            setQuoteItemsDraft((prev) => [
                              ...prev,
                              {
                                serviceId: srv.id,
                                description: srv.titleFr,
                                quantity: 1,
                                unitPriceMad: srv.unitPriceMad,
                              },
                            ]);
                          }
                        }}
                        className="px-3 py-1.5 text-xs border border-[#D8D8D2] rounded bg-white"
                      >
                        <option value="">+ Ajouter depuis le catalogue...</option>
                        {data.services.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.titleFr} ({formatMad(s.unitPriceMad)})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2 border-t border-[#E5E5E0]">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[#52525B] mb-1">Réduction (MAD)</label>
                        <input
                          type="number"
                          min="0"
                          value={quoteDiscount}
                          onChange={(e) => setQuoteDiscount(e.target.value)}
                          className="w-full px-3 py-2 border border-[#D8D8D2] rounded tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block text-[#52525B] mb-1">Conditions de paiement</label>
                        <input
                          type="text"
                          value={quoteTerms}
                          onChange={(e) => setQuoteTerms(e.target.value)}
                          className="w-full px-3 py-2 border border-[#D8D8D2] rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-[#52525B] mb-1">Notes</label>
                        <input
                          type="text"
                          value={quoteNotes}
                          onChange={(e) => setQuoteNotes(e.target.value)}
                          className="w-full px-3 py-2 border border-[#D8D8D2] rounded"
                        />
                      </div>
                    </div>

                    <div className="bg-[#F6F6F4] p-4 rounded-md space-y-2 text-xs">
                      <div className="flex justify-between tabular-nums">
                        <span>Sous-total</span>
                        <span>{formatMad(quoteSubtotal)}</span>
                      </div>
                      <div className="flex justify-between tabular-nums">
                        <span>Réduction</span>
                        <span>- {formatMad(quoteDiscountNum)}</span>
                      </div>
                      <div className="flex justify-between tabular-nums">
                        <span>TVA ({quoteVatRate}%)</span>
                        <span>{formatMad(quoteVatNum)}</span>
                      </div>
                      <div className="flex justify-between tabular-nums text-base font-semibold text-[#0A0A0B] border-t border-[#D8D8D2] pt-2">
                        <span>Total TTC</span>
                        <span>{formatMad(quoteTotalTtc)}</span>
                      </div>
                      <div className="flex gap-2 pt-3">
                        <button
                          type="button"
                          onClick={() => handleCreateQuote(false)}
                          className="flex-1 py-2 border border-[#0A0A0B] text-[#0A0A0B] rounded font-medium"
                        >
                          Brouillon
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCreateQuote(true)}
                          className="flex-1 py-2 bg-[#0A0A0B] text-white rounded font-semibold"
                        >
                          Créer &amp; Envoyer au client
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quotes List */}
                <div className="bg-white border border-[#E5E5E0] rounded-lg p-5 space-y-3">
                  <h2 className="text-base font-semibold text-[#0A0A0B]">Devis émis</h2>
                  {data.quotes.length === 0 ? (
                    <p className="text-xs text-[#6B6B73]">Aucun devis créé.</p>
                  ) : (
                    <div className="divide-y divide-[#E5E5E0]">
                      {data.quotes.map((q) => {
                        const items = data.quoteItems.filter((qi) => qi.quoteId === q.id);
                        return (
                          <div key={q.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                            <div>
                              <span className="font-mono font-semibold">{q.quoteNumber}</span> · {q.clientName} ·{' '}
                              <span className="tabular-nums font-medium">{formatMad(q.totalTtcMad)}</span> · Statut :{' '}
                              {q.status}
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => downloadQuotePdf(q, items, data.settings)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 border border-[#D8D8D2] rounded"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>PDF</span>
                              </button>
                              {q.status === 'brouillon' && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await apiFetch(`/api/admin/quotes/${q.id}`, {
                                      method: 'PATCH',
                                      body: JSON.stringify({ status: 'envoye' }),
                                    });
                                    await loadOverview();
                                  }}
                                  className="px-2.5 py-1 bg-[#0A0A0B] text-white rounded"
                                >
                                  Envoyer
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Payments & Invoices */}
                <div className="bg-white border border-[#E5E5E0] rounded-lg p-5 space-y-3">
                  <h2 className="text-base font-semibold text-[#0A0A0B]">
                    Suivi des Paiements &amp; Validation
                  </h2>
                  {data.payments.length === 0 ? (
                    <p className="text-xs text-[#6B6B73]">Aucune transaction enregistrée.</p>
                  ) : (
                    <div className="divide-y divide-[#E5E5E0]">
                      {data.payments.map((p) => (
                        <div key={p.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="font-mono font-semibold">{p.transactionRef}</span> · {p.method} ·{' '}
                            <span className="tabular-nums font-medium">{formatMad(p.amountMad)}</span> ·{' '}
                            {p.status} ({p.gatewayMode})
                          </div>
                          <div className="flex gap-2">
                            {p.status !== 'valide' && (
                              <button
                                type="button"
                                onClick={() => handleUpdatePaymentStatus(p.id, 'valide')}
                                className="px-2.5 py-1 bg-emerald-700 text-white rounded"
                              >
                                Valider encaissement
                              </button>
                            )}
                            {p.status !== 'echoue' && (
                              <button
                                type="button"
                                onClick={() => handleUpdatePaymentStatus(p.id, 'echoue')}
                                className="px-2.5 py-1 border border-red-200 text-red-700 rounded"
                              >
                                Rejeter
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white border border-[#E5E5E0] rounded-lg p-5 space-y-3">
                  <h2 className="text-base font-semibold text-[#0A0A0B]">Factures émises</h2>
                  {data.invoices.length === 0 ? (
                    <p className="text-xs text-[#6B6B73]">Aucune facture émise.</p>
                  ) : (
                    <div className="divide-y divide-[#E5E5E0]">
                      {data.invoices.map((inv) => {
                        const items = data.quoteItems.filter((qi) => qi.quoteId === inv.quoteId);
                        return (
                          <div key={inv.id} className="py-3 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-mono font-semibold">{inv.invoiceNumber}</span> · {inv.clientName} ·{' '}
                              <span className="tabular-nums">{formatMad(inv.paidAmountMad)} / {formatMad(inv.totalTtcMad)}</span> ({inv.status})
                            </div>
                            <button
                              type="button"
                              onClick={() => downloadInvoicePdf(inv, items, data.settings)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 border border-[#D8D8D2] rounded"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Facture PDF</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* G. CONTENT & GALLERY */}
            {section === 'content' && settingsDraft && (
              <div className="space-y-8">
                <h1 className="font-display text-3xl font-semibold text-[#0A0A0B]">
                  Contenu, Statistiques &amp; Galerie
                </h1>

                <form onSubmit={handleSaveSettings} className="bg-white border border-[#E5E5E0] rounded-lg p-6 space-y-4">
                  <h2 className="text-base font-semibold text-[#0A0A0B]">
                    Textes de la page d’accueil &amp; Chiffres Clés
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-[#52525B] mb-1">Titre Hero</label>
                      <input
                        type="text"
                        value={settingsDraft.heroTitleFr}
                        onChange={(e) =>
                          setSettingsDraft({ ...settingsDraft, heroTitleFr: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-[#D8D8D2] rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[#52525B] mb-1">Titre Appel à l’action</label>
                      <input
                        type="text"
                        value={settingsDraft.ctaTitleFr}
                        onChange={(e) =>
                          setSettingsDraft({ ...settingsDraft, ctaTitleFr: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-[#D8D8D2] rounded"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[#52525B] mb-1">Sous-titre Hero</label>
                      <textarea
                        rows={2}
                        value={settingsDraft.heroSubtitleFr}
                        onChange={(e) =>
                          setSettingsDraft({ ...settingsDraft, heroSubtitleFr: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-[#D8D8D2] rounded"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                    {settingsDraft.stats.map((st, idx) => (
                      <div key={st.key} className="p-3 border border-[#E5E5E0] rounded space-y-2 text-xs">
                        <div className="font-medium text-[#0A0A0B]">{st.labelFr}</div>
                        <input
                          type="text"
                          value={st.value}
                          onChange={(e) => {
                            const next = [...settingsDraft.stats];
                            next[idx] = { ...st, value: e.target.value };
                            setSettingsDraft({ ...settingsDraft, stats: next });
                          }}
                          className="w-full px-2.5 py-1.5 border border-[#D8D8D2] rounded"
                        />
                        <input
                          type="text"
                          value={st.unitOrContext}
                          onChange={(e) => {
                            const next = [...settingsDraft.stats];
                            next[idx] = { ...st, unitOrContext: e.target.value };
                            setSettingsDraft({ ...settingsDraft, stats: next });
                          }}
                          className="w-full px-2.5 py-1.5 border border-[#D8D8D2] rounded"
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-semibold bg-[#0A0A0B] text-white rounded"
                  >
                    Enregistrer les textes et statistiques
                  </button>
                </form>

                {/* Gallery manager */}
                <div className="bg-white border border-[#E5E5E0] rounded-lg p-6 space-y-4">
                  <h2 className="text-base font-semibold text-[#0A0A0B]">Galerie Médias</h2>
                  <form onSubmit={handleAddGalleryItem} className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                    <input
                      type="text"
                      required
                      placeholder="Titre média *"
                      value={galTitle}
                      onChange={(e) => setGalTitle(e.target.value)}
                      className="px-3 py-2 border border-[#D8D8D2] rounded"
                    />
                    <select
                      value={galCategory}
                      onChange={(e) => setGalCategory(e.target.value as GalleryCategory)}
                      className="px-3 py-2 border border-[#D8D8D2] rounded bg-white"
                    >
                      <option value="mariages">Mariages</option>
                      <option value="anniversaires">Anniversaires</option>
                      <option value="conferences">Conférences</option>
                      <option value="decorations">Décorations</option>
                      <option value="soirees">Soirées</option>
                      <option value="concerts">Concerts</option>
                      <option value="entreprise">Entreprise</option>
                    </select>
                    <select
                      value={galType}
                      onChange={(e) => setGalType(e.target.value as 'photo' | 'video')}
                      className="px-3 py-2 border border-[#D8D8D2] rounded bg-white"
                    >
                      <option value="photo">Photo</option>
                      <option value="video">Vidéo</option>
                    </select>
                    <input
                      type="text"
                      required
                      placeholder="URL sécurisée (https://...)"
                      value={galUrl}
                      onChange={(e) => setGalUrl(e.target.value)}
                      className="px-3 py-2 border border-[#D8D8D2] rounded"
                    />
                    <button type="submit" className="px-4 py-2 bg-[#0A0A0B] text-white rounded font-semibold">
                      Ajouter média
                    </button>
                  </form>
                  <div className="divide-y divide-[#E5E5E0] text-xs">
                    {data.gallery.map((g) => (
                      <div key={g.id} className="py-2.5 flex justify-between items-center">
                        <span>{g.titleFr} · {g.category} ({g.mediaType})</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteGalleryItem(g.id)}
                          className="text-red-700 hover:underline"
                        >
                          Supprimer
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Testimonials manager */}
                <div className="bg-white border border-[#E5E5E0] rounded-lg p-6 space-y-4">
                  <h2 className="text-base font-semibold text-[#0A0A0B]">Témoignages</h2>
                  <form onSubmit={handleAddTestimonial} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                    <input
                      type="text"
                      required
                      placeholder="Auteur *"
                      value={testAuthor}
                      onChange={(e) => setTestAuthor(e.target.value)}
                      className="px-3 py-2 border border-[#D8D8D2] rounded"
                    />
                    <input
                      type="text"
                      placeholder="Fonction"
                      value={testRole}
                      onChange={(e) => setTestRole(e.target.value)}
                      className="px-3 py-2 border border-[#D8D8D2] rounded"
                    />
                    <input
                      type="text"
                      placeholder="Ville / Entreprise"
                      value={testCompany}
                      onChange={(e) => setTestCompany(e.target.value)}
                      className="px-3 py-2 border border-[#D8D8D2] rounded"
                    />
                    <input
                      type="text"
                      placeholder="Type événement"
                      value={testEventType}
                      onChange={(e) => setTestEventType(e.target.value)}
                      className="px-3 py-2 border border-[#D8D8D2] rounded"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Témoignage *"
                      value={testQuote}
                      onChange={(e) => setTestQuote(e.target.value)}
                      className="md:col-span-3 px-3 py-2 border border-[#D8D8D2] rounded"
                    />
                    <button type="submit" className="px-4 py-2 bg-[#0A0A0B] text-white rounded font-semibold">
                      Publier
                    </button>
                  </form>
                  <div className="divide-y divide-[#E5E5E0] text-xs">
                    {data.testimonials.map((t) => (
                      <div key={t.id} className="py-2.5 flex justify-between items-center gap-4">
                        <span><strong>{t.authorName}</strong> : « {t.quoteFr} »</span>
                        <button
                          type="button"
                          onClick={async () => {
                            await apiFetch(`/api/admin/testimonials/${t.id}`, { method: 'DELETE' });
                            await loadOverview();
                            await onBootstrapRefresh();
                          }}
                          className="text-red-700 shrink-0"
                        >
                          Supprimer
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* H. SETTINGS */}
            {section === 'settings' && settingsDraft && (
              <div className="space-y-8">
                <h1 className="font-display text-3xl font-semibold text-[#0A0A0B]">
                  Paramètres Généraux &amp; Équipe Admin
                </h1>

                <form onSubmit={handleSaveSettings} className="bg-white border border-[#E5E5E0] rounded-lg p-6 space-y-5 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#52525B] mb-1">Nom de l’entreprise</label>
                      <input
                        type="text"
                        value={settingsDraft.companyName}
                        onChange={(e) => setSettingsDraft({ ...settingsDraft, companyName: e.target.value })}
                        className="w-full px-3 py-2 border border-[#D8D8D2] rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[#52525B] mb-1">Slogan</label>
                      <input
                        type="text"
                        value={settingsDraft.sloganFr}
                        onChange={(e) => setSettingsDraft({ ...settingsDraft, sloganFr: e.target.value })}
                        className="w-full px-3 py-2 border border-[#D8D8D2] rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[#52525B] mb-1">Téléphone</label>
                      <input
                        type="text"
                        value={settingsDraft.phone}
                        onChange={(e) => setSettingsDraft({ ...settingsDraft, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-[#D8D8D2] rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[#52525B] mb-1">E-mail de contact</label>
                      <input
                        type="email"
                        value={settingsDraft.email}
                        onChange={(e) => setSettingsDraft({ ...settingsDraft, email: e.target.value })}
                        className="w-full px-3 py-2 border border-[#D8D8D2] rounded"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[#52525B] mb-1">Adresse</label>
                      <input
                        type="text"
                        value={settingsDraft.address}
                        onChange={(e) => setSettingsDraft({ ...settingsDraft, address: e.target.value })}
                        className="w-full px-3 py-2 border border-[#D8D8D2] rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[#52525B] mb-1">Taux de TVA par défaut (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={settingsDraft.vatRatePercent}
                        onChange={(e) =>
                          setSettingsDraft({ ...settingsDraft, vatRatePercent: Number(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-2 border border-[#D8D8D2] rounded tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-[#52525B] mb-1">Max réservations / jour</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={settingsDraft.maxBookingsPerDay}
                        onChange={(e) =>
                          setSettingsDraft({ ...settingsDraft, maxBookingsPerDay: Number(e.target.value) || 1 })
                        }
                        className="w-full px-3 py-2 border border-[#D8D8D2] rounded tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-[#52525B] mb-1">Nom de banque (Virement)</label>
                      <input
                        type="text"
                        value={settingsDraft.bankName}
                        onChange={(e) => setSettingsDraft({ ...settingsDraft, bankName: e.target.value })}
                        className="w-full px-3 py-2 border border-[#D8D8D2] rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[#52525B] mb-1">RIB Bancaire</label>
                      <input
                        type="text"
                        value={settingsDraft.bankRib}
                        onChange={(e) => setSettingsDraft({ ...settingsDraft, bankRib: e.target.value })}
                        className="w-full px-3 py-2 border border-[#D8D8D2] rounded font-mono"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settingsDraft.allowOnSitePayment}
                      onChange={(e) =>
                        setSettingsDraft({ ...settingsDraft, allowOnSitePayment: e.target.checked })
                      }
                    />
                    <span>Autoriser le paiement sur place à l’agence</span>
                  </label>

                  {/* Blocked dates */}
                  <div className="pt-2 border-t border-[#E5E5E0] space-y-2">
                    <div className="font-medium text-[#0A0A0B]">Dates bloquées (indisponibles)</div>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={newBlockedDate}
                        onChange={(e) => setNewBlockedDate(e.target.value)}
                        className="px-3 py-1.5 border border-[#D8D8D2] rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newBlockedDate && !settingsDraft.blockedDates.includes(newBlockedDate)) {
                            setSettingsDraft({
                              ...settingsDraft,
                              blockedDates: [...settingsDraft.blockedDates, newBlockedDate],
                            });
                            setNewBlockedDate('');
                          }
                        }}
                        className="px-3 py-1.5 border border-[#D8D8D2] rounded"
                      >
                        Bloquer cette date
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {settingsDraft.blockedDates.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() =>
                            setSettingsDraft({
                              ...settingsDraft,
                              blockedDates: settingsDraft.blockedDates.filter((x) => x !== d),
                            })
                          }
                          className="px-2.5 py-1 bg-[#F6F6F4] border border-[#D8D8D2] rounded tabular-nums"
                        >
                          {d} ×
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-[#F6F6F4] rounded text-[#52525B]">
                    Passerelle paiement : <strong>{settingsDraft.paymentGatewayMode}</strong> · E-mail SMTP :{' '}
                    <strong>{settingsDraft.smtpConfigured ? 'Configuré' : 'Non configuré'}</strong>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#0A0A0B] text-white font-semibold rounded"
                  >
                    Enregistrer tous les paramètres
                  </button>
                </form>

                {/* Admin Users */}
                <div className="bg-white border border-[#E5E5E0] rounded-lg p-6 space-y-4 text-xs">
                  <h2 className="text-base font-semibold text-[#0A0A0B]">
                    Utilisateurs Administrateurs &amp; Managers
                  </h2>
                  <form onSubmit={handleCreateAdminUser} className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Nom complet"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      className="px-3 py-2 border border-[#D8D8D2] rounded"
                    />
                    <input
                      type="email"
                      required
                      placeholder="E-mail"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      className="px-3 py-2 border border-[#D8D8D2] rounded"
                    />
                    <input
                      type="password"
                      required
                      minLength={10}
                      placeholder="Mot de passe (10+ car.)"
                      value={newAdminPass}
                      onChange={(e) => setNewAdminPass(e.target.value)}
                      className="px-3 py-2 border border-[#D8D8D2] rounded"
                    />
                    <select
                      value={newAdminRole}
                      onChange={(e) => setNewAdminRole(e.target.value as 'admin' | 'manager')}
                      className="px-3 py-2 border border-[#D8D8D2] rounded bg-white"
                    >
                      <option value="manager">Manager</option>
                      <option value="admin">Administrateur</option>
                    </select>
                    <button type="submit" className="px-4 py-2 bg-[#0A0A0B] text-white rounded font-semibold">
                      Ajouter
                    </button>
                  </form>
                  <div className="divide-y divide-[#E5E5E0]">
                    {data.adminUsers.map((u) => (
                      <div key={u.id} className="py-2 flex justify-between">
                        <span>{u.fullName} ({u.email})</span>
                        <span className="font-medium">{u.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
