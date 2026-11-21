import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  LogOut,
  User,
} from 'lucide-react';
import { formatMad, useI18n } from '../i18n.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { downloadInvoicePdf, downloadQuotePdf } from '../utils/pdf.ts';
import type {
  Booking,
  Invoice,
  NotificationItem,
  Payment,
  PaymentMethod,
  PaymentType,
  Profile,
  Quote,
  QuoteItem,
  SiteSettings,
} from '../types.ts';
import type { AppRoute } from './Navbar.tsx';

interface ClientPortalProps {
  settings: SiteSettings;
  onNavigate: (route: AppRoute) => void;
}

interface ClientDashboardData {
  bookings: Booking[];
  quotes: Quote[];
  quoteItems: QuoteItem[];
  payments: Payment[];
  invoices: Invoice[];
  notifications: NotificationItem[];
  paymentGatewayMode: 'test' | 'live';
}

export function ClientPortal({ settings, onNavigate }: ClientPortalProps) {
  const { t } = useI18n();
  const { isAuthenticated, user, profile, apiFetch, setSession, updateProfileState, logout } =
    useAuth();

  const [authTab, setAuthTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCity, setRegCity] = useState('Casablanca');
  const [regCompany, setRegCompany] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [cndpAccepted, setCndpAccepted] = useState(false);

  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'verify'>('request');

  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'bookings' | 'quotes' | 'payments' | 'profile'>(
    'bookings'
  );
  const [dashboard, setDashboard] = useState<ClientDashboardData | null>(null);
  const [dashLoading, setDashLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Payment modal state
  const [payingQuote, setPayingQuote] = useState<Quote | null>(null);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('carte_bancaire');
  const [payType, setPayType] = useState<PaymentType>('acompte');
  const [payAmount, setPayAmount] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Profile form state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editCompany, setEditCompany] = useState('');

  const loadDashboard = useCallback(async () => {
    if (!isAuthenticated) return;
    setDashLoading(true);
    try {
      const data = await apiFetch<ClientDashboardData>('/api/client/dashboard');
      setDashboard(data);
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : 'Impossible de charger votre espace.');
    } finally {
      setDashLoading(false);
    }
  }, [apiFetch, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboard();
    }
  }, [isAuthenticated, loadDashboard]);

  useEffect(() => {
    if (profile) {
      setEditName(profile.fullName);
      setEditPhone(profile.phone);
      setEditCity(profile.city);
      setEditCompany(profile.company);
    }
  }, [profile]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const data = await apiFetch<{
        token: string;
        user: { id: string; email: string; role: 'client' | 'admin' | 'manager' };
        profile: Profile | null;
      }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      setSession(data.token, data.user, data.profile);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Erreur de connexion.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const data = await apiFetch<{
        token: string;
        user: { id: string; email: string; role: 'client' };
        profile: Profile;
      }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          fullName: regName,
          email: regEmail,
          phone: regPhone,
          city: regCity,
          company: regCompany,
          password: regPassword,
          cndpAccepted,
        }),
      });
      setSession(data.token, data.user, data.profile);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Erreur lors de l'inscription.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setAuthLoading(true);
    try {
      if (forgotStep === 'request') {
        const res = await apiFetch<{ message: string }>('/api/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email: forgotEmail }),
        });
        setAuthSuccess(res.message);
        setForgotStep('verify');
      } else {
        await apiFetch('/api/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({
            email: forgotEmail,
            code: resetCode,
            newPassword: resetNewPass,
          }),
        });
        setAuthSuccess('Mot de passe mis à jour. Vous pouvez maintenant vous connecter.');
        setAuthTab('login');
        setForgotStep('request');
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Erreur de réinitialisation.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    setActionMsg(null);
    try {
      await apiFetch(`/api/client/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: "Annulation depuis l'espace client" }),
      });
      setActionMsg('La réservation a été annulée.');
      await loadDashboard();
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : "Impossible d'annuler cette réservation.");
    }
  };

  const handleQuoteResponse = async (quoteId: string, action: 'accept' | 'refuse') => {
    setActionMsg(null);
    try {
      await apiFetch(`/api/client/quotes/${quoteId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      setActionMsg(
        action === 'accept'
          ? 'Devis accepté et facture générée.'
          : 'Devis refusé. Notre équipe reste à votre écoute.'
      );
      await loadDashboard();
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : 'Erreur lors de la réponse au devis.');
    }
  };

  const openPaymentModal = (quote: Quote) => {
    setPayingQuote(quote);
    setPayType('acompte');
    setPayAmount(String(Math.round(quote.totalTtcMad * 0.3)));
    setPayMethod('carte_bancaire');
    setPayNotes('');
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingQuote) return;
    setActionMsg(null);
    try {
      const res = await apiFetch<{ payment: Payment; gatewayMode: 'test' | 'live' }>(
        '/api/client/payments',
        {
          method: 'POST',
          body: JSON.stringify({
            quoteId: payingQuote.id,
            paymentType: payType,
            method: payMethod,
            amountMad: Number(payAmount),
            notes: payNotes,
          }),
        }
      );
      setPayingQuote(null);
      setActionMsg(
        `Transaction ${res.payment.transactionRef} enregistrée (${res.payment.status.replace(/_/g, ' ')}).`
      );
      await loadDashboard();
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : 'Erreur lors du paiement.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMsg(null);
    try {
      const res = await apiFetch<{ profile: Profile }>('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: editName,
          phone: editPhone,
          city: editCity,
          company: editCompany,
        }),
      });
      updateProfileState(res.profile);
      setActionMsg('Profil mis à jour.');
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : 'Erreur mise à jour profil.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="py-16 bg-[#F6F6F4] min-h-[75vh]">
        <div className="max-w-lg mx-auto px-4">
          <div className="bg-white border border-[#E5E5E0] rounded-lg p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <h1 className="font-display text-3xl font-semibold text-[#0A0A0B]">Espace Client</h1>
              <p className="text-xs text-[#6B6B73]">
                Suivez vos réservations, devis, factures et règlements en toute sécurité.
              </p>
            </div>

            <div className="flex gap-1 p-1 bg-[#F6F6F4] rounded-md">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('login');
                  setAuthError(null);
                }}
                className={`flex-1 py-2 text-xs font-medium rounded ${
                  authTab === 'login' ? 'bg-white text-[#0A0A0B] shadow-sm' : 'text-[#52525B]'
                }`}
              >
                Connexion
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('register');
                  setAuthError(null);
                }}
                className={`flex-1 py-2 text-xs font-medium rounded ${
                  authTab === 'register' ? 'bg-white text-[#0A0A0B] shadow-sm' : 'text-[#52525B]'
                }`}
              >
                Inscription
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('forgot');
                  setAuthError(null);
                }}
                className={`flex-1 py-2 text-xs font-medium rounded ${
                  authTab === 'forgot' ? 'bg-white text-[#0A0A0B] shadow-sm' : 'text-[#52525B]'
                }`}
              >
                Mot de passe
              </button>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-900 text-xs rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}
            {authSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{authSuccess}</span>
              </div>
            )}

            {authTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#4A4A52] mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-[#D8D8D2] rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A4A52] mb-1">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-[#D8D8D2] rounded-md"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 text-sm font-semibold bg-[#0A0A0B] text-white hover:bg-[#C59B27] hover:text-[#0A0A0B] transition-colors rounded-md"
                >
                  {authLoading ? 'Connexion...' : 'Se connecter'}
                </button>
              </form>
            )}

            {authTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#4A4A52] mb-1">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-[#D8D8D2] rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A4A52] mb-1">E-mail *</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-[#D8D8D2] rounded-md"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#4A4A52] mb-1">
                      Téléphone (MA) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+212 6..."
                      className="w-full px-3.5 py-2 text-sm border border-[#D8D8D2] rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4A4A52] mb-1">Ville</label>
                    <input
                      type="text"
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-[#D8D8D2] rounded-md"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A4A52] mb-1">
                    Entreprise (facultatif)
                  </label>
                  <input
                    type="text"
                    value={regCompany}
                    onChange={(e) => setRegCompany(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-[#D8D8D2] rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A4A52] mb-1">
                    Mot de passe (min. 8 caractères) *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-[#D8D8D2] rounded-md"
                  />
                </div>
                <label className="flex items-start gap-2.5 text-xs text-[#4A4A52] pt-1">
                  <input
                    type="checkbox"
                    checked={cndpAccepted}
                    onChange={(e) => setCndpAccepted(e.target.checked)}
                    className="mt-0.5 accent-[#0A0A0B]"
                  />
                  <span>
                    J’accepte le traitement de mes données conformément à la politique de confidentialité (Loi 09-08 / CNDP).
                  </span>
                </label>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 text-sm font-semibold bg-[#0A0A0B] text-white hover:bg-[#C59B27] hover:text-[#0A0A0B] transition-colors rounded-md"
                >
                  {authLoading ? 'Création...' : 'Créer mon compte client'}
                </button>
              </form>
            )}

            {authTab === 'forgot' && (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#4A4A52] mb-1">
                    E-mail du compte
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-[#D8D8D2] rounded-md"
                  />
                </div>
                {forgotStep === 'verify' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-[#4A4A52] mb-1">
                        Code de réinitialisation
                      </label>
                      <input
                        type="text"
                        required
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm border border-[#D8D8D2] rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#4A4A52] mb-1">
                        Nouveau mot de passe (min. 8 car.)
                      </label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={resetNewPass}
                        onChange={(e) => setResetNewPass(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm border border-[#D8D8D2] rounded-md"
                      />
                    </div>
                  </>
                )}
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 text-sm font-semibold bg-[#0A0A0B] text-white rounded-md"
                >
                  {forgotStep === 'request' ? 'Demander une réinitialisation' : 'Valider le nouveau mot de passe'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-[#F6F6F4] min-h-[80vh]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-8">
        {/* Top bar */}
        <div className="bg-white border border-[#E5E5E0] rounded-lg p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-[#A8821B] font-medium">Espace Personnel Sécurisé</div>
            <h1 className="font-display text-3xl font-semibold text-[#0A0A0B]">
              Bonjour, {profile?.fullName || user?.email}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('/reserver')}
              className="px-4 py-2 text-xs font-semibold bg-[#0A0A0B] text-white hover:bg-[#C59B27] hover:text-[#0A0A0B] transition-colors rounded-md"
            >
              Nouvelle réservation
            </button>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium border border-[#E5E5E0] text-[#4A4A52] hover:text-[#0A0A0B] rounded-md"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>

        {actionMsg && (
          <div className="p-4 bg-white border border-[#C59B27] text-sm text-[#0A0A0B] rounded-md flex items-center justify-between">
            <span>{actionMsg}</span>
            <button type="button" onClick={() => setActionMsg(null)} className="text-xs text-[#6B6B73]">
              Fermer
            </button>
          </div>
        )}

        {/* Notifications strip if any */}
        {dashboard && dashboard.notifications.length > 0 && (
          <div className="bg-white border border-[#E5E5E0] rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#0A0A0B]">
              <Bell className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>Notifications récentes</span>
            </div>
            <div className="divide-y divide-[#E5E5E0]">
              {dashboard.notifications.slice(0, 3).map((n) => (
                <div key={n.id} className="py-2 text-xs flex justify-between gap-4">
                  <span>
                    <strong className="text-[#0A0A0B]">{n.title}</strong> — {n.message}
                  </span>
                  <span className="text-[#6B6B73] tabular-nums shrink-0">{n.createdAt.slice(0, 10)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-white border border-[#E5E5E0] rounded-lg w-fit">
          {[
            { id: 'bookings', label: `Réservations (${dashboard?.bookings.length ?? 0})` },
            { id: 'quotes', label: `Devis & Factures (${dashboard?.quotes.length ?? 0})` },
            { id: 'payments', label: `Paiements (${dashboard?.payments.length ?? 0})` },
            { id: 'profile', label: 'Mon profil' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 text-xs font-medium rounded-md transition-colors ${
                activeTab === tab.id ? 'bg-[#0A0A0B] text-white' : 'text-[#52525B] hover:text-[#0A0A0B]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {dashLoading ? (
          <div className="bg-white border border-[#E5E5E0] rounded-lg p-12 text-center text-sm text-[#6B6B73]">
            Chargement de vos dossiers...
          </div>
        ) : (
          <>
            {activeTab === 'bookings' && (
              <div className="space-y-4">
                {!dashboard || dashboard.bookings.length === 0 ? (
                  <div className="bg-white border border-[#E5E5E0] rounded-lg p-10 text-center space-y-3">
                    <p className="text-sm text-[#52525B]">
                      Vous n’avez pas encore de réservation enregistrée avec cet e-mail.
                    </p>
                    <button
                      type="button"
                      onClick={() => onNavigate('/reserver')}
                      className="px-5 py-2.5 text-xs font-semibold bg-[#0A0A0B] text-white rounded-md"
                    >
                      Créer ma première demande
                    </button>
                  </div>
                ) : (
                  dashboard.bookings.map((b) => (
                    <div
                      key={b.id}
                      className="bg-white border border-[#E5E5E0] rounded-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="text-xs text-[#6B6B73] tabular-nums">
                          <span className="font-mono font-semibold text-[#0A0A0B]">{b.bookingNumber}</span>
                          <span className="mx-2">·</span>
                          <span>{t.statusLabels[b.status] || b.status}</span>
                        </div>
                        <h3 className="font-display text-2xl font-semibold text-[#0A0A0B]">
                          {b.eventType} — {b.venue}
                        </h3>
                        <div className="text-xs text-[#52525B] tabular-nums">
                          Date : {b.eventDate} à {b.eventTime} · {b.guestCount} invités · Budget : {formatMad(b.budgetMad)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {b.status !== 'annulee' && b.status !== 'evenement_termine' && (
                          <button
                            type="button"
                            onClick={() => handleCancelBooking(b.id)}
                            className="px-3.5 py-2 text-xs font-medium border border-red-200 text-red-700 hover:bg-red-50 rounded-md"
                          >
                            Annuler
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'quotes' && dashboard && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h2 className="font-display text-2xl font-semibold text-[#0A0A0B]">Vos Devis</h2>
                  {dashboard.quotes.length === 0 ? (
                    <div className="bg-white border border-[#E5E5E0] rounded-lg p-8 text-sm text-[#6B6B73]">
                      Aucun devis émis pour le moment.
                    </div>
                  ) : (
                    dashboard.quotes.map((q) => {
                      const items = dashboard.quoteItems.filter((qi) => qi.quoteId === q.id);
                      return (
                        <div key={q.id} className="bg-white border border-[#E5E5E0] rounded-lg p-6 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="text-xs text-[#6B6B73]">
                                <span className="font-mono font-semibold text-[#0A0A0B]">{q.quoteNumber}</span>
                                <span className="mx-2">·</span>
                                <span>Statut : {q.status}</span>
                                <span className="mx-2">·</span>
                                <span className="tabular-nums">Valide jusqu’au {q.validUntil}</span>
                              </div>
                              <div className="font-display text-2xl font-semibold text-[#A8821B] tabular-nums mt-1">
                                Total TTC : {formatMad(q.totalTtcMad)}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => downloadQuotePdf(q, items, settings)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-[#E5E5E0] rounded-md hover:bg-[#F6F6F4]"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>PDF Devis</span>
                              </button>
                              {q.status === 'envoye' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleQuoteResponse(q.id, 'accept')}
                                    className="px-3.5 py-2 text-xs font-semibold bg-[#0A0A0B] text-white hover:bg-[#C59B27] hover:text-[#0A0A0B] rounded-md"
                                  >
                                    Accepter le devis
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleQuoteResponse(q.id, 'refuse')}
                                    className="px-3.5 py-2 text-xs font-medium border border-red-200 text-red-700 rounded-md"
                                  >
                                    Refuser
                                  </button>
                                </>
                              )}
                              {q.status === 'accepte' && (
                                <button
                                  type="button"
                                  onClick={() => openPaymentModal(q)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#C59B27] text-[#0A0A0B] rounded-md"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>Régler acompte / solde</span>
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="border-t border-[#E5E5E0] pt-3 text-xs text-[#52525B] space-y-1">
                            {items.map((it) => (
                              <div key={it.id} className="flex justify-between tabular-nums">
                                <span>{it.description} (x{it.quantity})</span>
                                <span>{formatMad(it.totalMad)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="space-y-4">
                  <h2 className="font-display text-2xl font-semibold text-[#0A0A0B]">Vos Factures</h2>
                  {dashboard.invoices.length === 0 ? (
                    <div className="bg-white border border-[#E5E5E0] rounded-lg p-8 text-sm text-[#6B6B73]">
                      Vos factures apparaîtront ici dès l’acceptation d’un devis.
                    </div>
                  ) : (
                    dashboard.invoices.map((inv) => {
                      const items = dashboard.quoteItems.filter((qi) => qi.quoteId === inv.quoteId);
                      return (
                        <div
                          key={inv.id}
                          className="bg-white border border-[#E5E5E0] rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div>
                            <div className="text-xs text-[#6B6B73] tabular-nums">
                              <span className="font-mono font-semibold text-[#0A0A0B]">{inv.invoiceNumber}</span>
                              <span className="mx-2">·</span>
                              <span>Statut : {inv.status}</span>
                              <span className="mx-2">·</span>
                              <span>Réglé : {formatMad(inv.paidAmountMad)} / {formatMad(inv.totalTtcMad)}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => downloadInvoicePdf(inv, items, settings)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-[#E5E5E0] rounded-md hover:bg-[#F6F6F4]"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#C59B27]" />
                            <span>Télécharger Facture PDF</span>
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {activeTab === 'payments' && dashboard && (
              <div className="bg-white border border-[#E5E5E0] rounded-lg p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E5E0] pb-4">
                  <div>
                    <h2 className="font-display text-2xl font-semibold text-[#0A0A0B]">
                      Historique des Transactions
                    </h2>
                    <p className="text-xs text-[#6B6B73]">
                      Mode passerelle : {dashboard.paymentGatewayMode === 'live' ? 'Production agréée' : 'Environnement de test (aucun débit réel)'}
                    </p>
                  </div>
                </div>
                {dashboard.payments.length === 0 ? (
                  <p className="text-sm text-[#6B6B73] py-4">Aucun paiement enregistré.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#E5E5E0] text-[#6B6B73]">
                          <th className="py-2.5 pr-4">Référence</th>
                          <th className="py-2.5 pr-4">Type</th>
                          <th className="py-2.5 pr-4">Méthode</th>
                          <th className="py-2.5 pr-4 text-right">Montant</th>
                          <th className="py-2.5 pr-4">Statut</th>
                          <th className="py-2.5">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5E0]">
                        {dashboard.payments.map((p) => (
                          <tr key={p.id}>
                            <td className="py-3 pr-4 font-mono">{p.transactionRef}</td>
                            <td className="py-3 pr-4">{p.paymentType}</td>
                            <td className="py-3 pr-4">{p.method.replace(/_/g, ' ')}</td>
                            <td className="py-3 pr-4 text-right tabular-nums font-medium">
                              {formatMad(p.amountMad)}
                            </td>
                            <td className="py-3 pr-4">{p.status.replace(/_/g, ' ')}</td>
                            <td className="py-3 tabular-nums text-[#6B6B73]">
                              {p.createdAt.slice(0, 10)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <form
                onSubmit={handleSaveProfile}
                className="bg-white border border-[#E5E5E0] rounded-lg p-6 sm:p-8 max-w-xl space-y-4"
              >
                <div className="flex items-center gap-2 text-lg font-semibold text-[#0A0A0B]">
                  <User className="w-4 h-4 text-[#C59B27]" />
                  <span>Informations personnelles</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A4A52] mb-1">Nom complet</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-[#D8D8D2] rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A4A52] mb-1">
                    Téléphone marocain
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-[#D8D8D2] rounded-md"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#4A4A52] mb-1">Ville</label>
                    <input
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-[#D8D8D2] rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4A4A52] mb-1">Entreprise</label>
                    <input
                      type="text"
                      value={editCompany}
                      onChange={(e) => setEditCompany(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-[#D8D8D2] rounded-md"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-semibold bg-[#0A0A0B] text-white rounded-md"
                >
                  Enregistrer les modifications
                </button>
              </form>
            )}
          </>
        )}

        {/* Payment Modal */}
        {payingQuote && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <form
              onSubmit={handleSubmitPayment}
              className="bg-white rounded-lg max-w-md w-full p-6 space-y-4"
            >
              <h3 className="font-display text-2xl font-semibold text-[#0A0A0B]">
                Règlement — {payingQuote.quoteNumber}
              </h3>

              <div className="p-3 bg-[#F6F6F4] rounded text-xs text-[#4A4A52] leading-relaxed">
                {settings.paymentGatewayMode === 'test'
                  ? "Environnement de test actif : aucun débit bancaire réel n'est effectué. Les paiements par carte sont enregistrés en statut test, et les virements/paiements sur place sont vérifiés par notre administration."
                  : 'Passerelle de paiement marocaine active.'}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A4A52] mb-1">Type de règlement</label>
                <select
                  value={payType}
                  onChange={(e) => {
                    const next = e.target.value as PaymentType;
                    setPayType(next);
                    if (next === 'acompte') setPayAmount(String(Math.round(payingQuote.totalTtcMad * 0.3)));
                    if (next === 'total') setPayAmount(String(payingQuote.totalTtcMad));
                  }}
                  className="w-full px-3 py-2 text-sm border border-[#D8D8D2] rounded-md bg-white"
                >
                  <option value="acompte">Acompte (ex. 30%)</option>
                  <option value="solde">Solde</option>
                  <option value="total">Montant total</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A4A52] mb-1">Moyen de paiement</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 text-sm border border-[#D8D8D2] rounded-md bg-white"
                >
                  <option value="carte_bancaire">Carte bancaire (Passerelle Maroc)</option>
                  <option value="virement_bancaire">Virement bancaire</option>
                  {settings.allowOnSitePayment && (
                    <option value="sur_place">Paiement sur place (Agence Casablanca)</option>
                  )}
                </select>
              </div>

              {payMethod === 'virement_bancaire' && (
                <div className="p-3 border border-[#E5E5E0] rounded text-xs space-y-1">
                  <div className="font-semibold text-[#0A0A0B]">{settings.bankName}</div>
                  <div className="font-mono text-[#4A4A52]">{settings.bankRib}</div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#4A4A52] mb-1">Montant (DH)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#D8D8D2] rounded-md tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A4A52] mb-1">Référence / Note</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Ex : Référence virement"
                  className="w-full px-3 py-2 text-sm border border-[#D8D8D2] rounded-md"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingQuote(null)}
                  className="px-4 py-2 text-xs font-medium border border-[#E5E5E0] rounded-md"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-[#0A0A0B] text-white rounded-md"
                >
                  Enregistrer le règlement
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
