import { useState } from 'react';
import { Menu, User, X } from 'lucide-react';
import { useI18n } from '../i18n.tsx';
import { useAuth } from '../context/AuthContext.tsx';

export type AppRoute =
  | '/'
  | '/evenements'
  | '/services'
  | '/galerie'
  | '/a-propos'
  | '/contact'
  | '/reserver'
  | '/espace-client'
  | '/admin'
  | '/mentions-legales'
  | '/confidentialite'
  | '/cgu'
  | '/conditions-reservation';

interface NavbarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  companyName: string;
}

export function Navbar({ currentRoute, onNavigate, companyName }: NavbarProps) {
  const { t, lang, setLang } = useI18n();
  const { isAuthenticated, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: { route: AppRoute; label: string }[] = [
    { route: '/', label: t.nav.home },
    { route: '/evenements', label: t.nav.events },
    { route: '/services', label: t.nav.services },
    { route: '/galerie', label: t.nav.gallery },
    { route: '/a-propos', label: t.nav.about },
    { route: '/contact', label: t.nav.contact },
  ];

  const handleNav = (route: AppRoute) => {
    setMobileOpen(false);
    onNavigate(route);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E5E0]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line brand mark */}
        <button
          type="button"
          onClick={() => handleNav('/')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#C59B27] rounded"
          aria-label={companyName}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 28 28"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <rect x="2" y="2" width="24" height="24" stroke="#0A0A0B" strokeWidth="1.75" />
            <path d="M8 9H20M8 14H17M8 19H20" stroke="#C59B27" strokeWidth="1.75" />
          </svg>
          <span className="font-display text-2xl font-semibold tracking-tight text-[#0A0A0B] whitespace-nowrap shrink-0">
            {companyName || 'EVENT PRO'}
          </span>
        </button>

        {/* Zone 2: Clean single-line typography navigation */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#4A4A52]">
          {navItems.map((item) => {
            const active = currentRoute === item.route;
            return (
              <button
                key={item.route}
                type="button"
                onClick={() => handleNav(item.route)}
                className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                  active
                    ? 'text-[#0A0A0B] border-[#C59B27]'
                    : 'border-transparent hover:text-[#0A0A0B] hover:border-[#E5E5E0]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary CTA + Client Account Icon */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleNav(isAdmin ? '/admin' : '/espace-client')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#111113] hover:text-[#A8821B] transition-colors whitespace-nowrap shrink-0"
            title={t.nav.clientPortal}
          >
            <User className="w-4 h-4 text-[#C59B27]" />
            <span>{isAuthenticated ? (isAdmin ? 'Admin' : t.nav.clientPortal) : t.nav.clientPortal}</span>
          </button>
          <button
            type="button"
            onClick={() => handleNav('/reserver')}
            className="px-4 py-2 text-xs font-semibold tracking-wide bg-[#0A0A0B] text-white hover:bg-[#C59B27] hover:text-[#0A0A0B] transition-colors rounded-md whitespace-nowrap shrink-0"
          >
            {t.nav.bookNow}
          </button>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex lg:hidden items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleNav('/espace-client')}
            className="p-2.5 text-[#0A0A0B] hover:text-[#C59B27]"
            aria-label={t.nav.clientPortal}
          >
            <User className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="p-2.5 text-[#0A0A0B]"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#E5E5E0] bg-white px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.route}
              type="button"
              onClick={() => handleNav(item.route)}
              className={`block w-full text-left px-3 py-2.5 text-sm font-medium rounded-md ${
                currentRoute === item.route
                  ? 'bg-[#F6F6F4] text-[#0A0A0B]'
                  : 'text-[#4A4A52] hover:bg-[#F6F6F4]'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-2 border-t border-[#E5E5E0] flex flex-col gap-2">
            <button
              type="button"
              onClick={() => handleNav('/reserver')}
              className="w-full py-2.5 px-4 text-sm font-semibold bg-[#0A0A0B] text-white rounded-md"
            >
              {t.nav.bookNow}
            </button>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-[#6B6B73]">Langue</span>
              <div className="flex items-center gap-1">
                {(['fr', 'ar', 'en'] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLang(code)}
                    className={`px-2.5 py-1 text-xs font-medium rounded ${
                      lang === code ? 'bg-[#0A0A0B] text-white' : 'bg-[#F6F6F4] text-[#4A4A52]'
                    }`}
                  >
                    {code.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
