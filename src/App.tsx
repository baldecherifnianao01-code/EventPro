import { useCallback, useEffect, useState } from 'react';
import { AuthProvider } from './context/AuthContext.tsx';
import { I18nProvider } from './i18n.tsx';
import { Navbar, type AppRoute } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { HomePage } from './components/HomePage.tsx';
import { BookingPage } from './components/BookingPage.tsx';
import {
  AboutPage,
  ContactPage,
  EventsCatalogPage,
  GalleryPage,
  LegalPage,
  ServicesCatalogPage,
} from './components/CatalogPages.tsx';
import { ClientPortal } from './components/ClientPortal.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { GoldCursor } from './components/GoldCursor.tsx';
import { ScrollProgressBar } from './components/ScrollProgressBar.tsx';
import type { BookingPreselection, PublicBootstrap } from './types.ts';

const VALID_ROUTES: AppRoute[] = [
  '/',
  '/evenements',
  '/services',
  '/galerie',
  '/a-propos',
  '/contact',
  '/reserver',
  '/espace-client',
  '/admin',
  '/mentions-legales',
  '/confidentialite',
  '/cgu',
  '/conditions-reservation',
];

function normalizeRoute(pathname: string): AppRoute {
  const clean = pathname.replace(/\/+$/, '') || '/';
  return VALID_ROUTES.includes(clean as AppRoute) ? (clean as AppRoute) : '/';
}

function AppShell() {
  const [route, setRoute] = useState<AppRoute>(() => normalizeRoute(window.location.pathname));
  const [bookingPreselection, setBookingPreselection] = useState<BookingPreselection | undefined>(
    undefined
  );
  const [bootstrap, setBootstrap] = useState<PublicBootstrap | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadBootstrap = useCallback(async () => {
    try {
      setLoadError(null);
      const res = await fetch('/api/public/bootstrap');
      if (!res.ok) throw new Error('Erreur lors du chargement des données.');
      const data = (await res.json()) as PublicBootstrap;
      setBootstrap(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Erreur réseau.');
    }
  }, []);

  useEffect(() => {
    loadBootstrap();
  }, [loadBootstrap]);

  useEffect(() => {
    const onPop = () => setRoute(normalizeRoute(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback(
    (nextRoute: AppRoute, preselect?: string | BookingPreselection) => {
      if (typeof preselect === 'string') {
        setBookingPreselection({ category: preselect });
      } else {
        setBookingPreselection(preselect);
      }
      if (window.location.pathname !== nextRoute) {
        window.history.pushState({}, '', nextRoute);
      }
      setRoute(nextRoute);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  if (loadError && !bootstrap) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h1 className="font-display text-3xl font-semibold">EVENT PRO</h1>
        <p className="text-sm text-[#52525B]">{loadError}</p>
        <button
          type="button"
          onClick={loadBootstrap}
          className="px-5 py-2.5 text-xs font-semibold bg-[#0A0A0B] text-white rounded-md"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!bootstrap) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-2">
          <div className="font-display text-3xl font-semibold text-[#0A0A0B]">EVENT PRO</div>
          <div className="text-xs text-[#6B6B73]">Chargement de la plateforme...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <ScrollProgressBar />
      <GoldCursor />
      <Navbar
        currentRoute={route}
        onNavigate={(r) => navigate(r)}
        companyName={bootstrap.settings.companyName}
      />

      <main className="flex-1">
        {route === '/' && (
          <HomePage
            categories={bootstrap.categories}
            events={bootstrap.events}
            gallery={bootstrap.gallery}
            testimonials={bootstrap.testimonials}
            settings={bootstrap.settings}
            onNavigate={navigate}
          />
        )}
        {route === '/evenements' && (
          <EventsCatalogPage
            categories={bootstrap.categories}
            events={bootstrap.events}
            onNavigate={navigate}
          />
        )}
        {route === '/services' && (
          <ServicesCatalogPage services={bootstrap.services} onNavigate={(r) => navigate(r)} />
        )}
        {route === '/galerie' && <GalleryPage gallery={bootstrap.gallery} />}
        {route === '/a-propos' && (
          <AboutPage settings={bootstrap.settings} onNavigate={(r) => navigate(r)} />
        )}
        {route === '/contact' && <ContactPage settings={bootstrap.settings} />}
        {route === '/reserver' && (
          <BookingPage
            categories={bootstrap.categories}
            services={bootstrap.services}
            preselection={bookingPreselection}
            onClearOffer={() => setBookingPreselection(undefined)}
            onNavigate={(r) => navigate(r)}
          />
        )}
        {route === '/espace-client' && (
          <ClientPortal settings={bootstrap.settings} onNavigate={(r) => navigate(r)} />
        )}
        {route === '/admin' && (
          <AdminDashboard onBootstrapRefresh={loadBootstrap} onNavigate={(r) => navigate(r)} />
        )}
        {route === '/mentions-legales' && (
          <LegalPage type="mentions" settings={bootstrap.settings} />
        )}
        {route === '/confidentialite' && (
          <LegalPage type="confidentialite" settings={bootstrap.settings} />
        )}
        {route === '/cgu' && <LegalPage type="cgu" settings={bootstrap.settings} />}
        {route === '/conditions-reservation' && (
          <LegalPage type="reservation" settings={bootstrap.settings} />
        )}
      </main>

      {route !== '/admin' && <Footer settings={bootstrap.settings} onNavigate={(r) => navigate(r)} />}
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </I18nProvider>
  );
}
