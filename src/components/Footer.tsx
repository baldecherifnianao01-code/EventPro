import { Mail, MapPin, Phone } from 'lucide-react';
import { useI18n } from '../i18n.tsx';
import type { SiteSettings } from '../types.ts';
import type { AppRoute } from './Navbar.tsx';

interface FooterProps {
  settings: SiteSettings;
  onNavigate: (route: AppRoute) => void;
}

export function Footer({ settings, onNavigate }: FooterProps) {
  const { lang, setLang } = useI18n();

  return (
    <footer className="bg-[#0A0A0B] text-white border-t border-white/10">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <rect x="2" y="2" width="24" height="24" stroke="#FFFFFF" strokeWidth="1.75" />
              <path d="M8 9H20M8 14H17M8 19H20" stroke="#C59B27" strokeWidth="1.75" />
            </svg>
            <span className="font-display text-2xl font-semibold tracking-tight text-white">
              {settings.companyName}
            </span>
          </div>
          <p className="text-sm text-white/75 leading-relaxed">{settings.sloganFr}</p>
          <p className="text-xs text-white/55 leading-relaxed">
            Casablanca &amp; interventions sur l’ensemble du Royaume du Maroc.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#C59B27] tracking-wide">Navigation</h3>
          <ul className="space-y-2 text-sm text-white/75">
            <li>
              <button type="button" onClick={() => onNavigate('/evenements')} className="hover:text-white transition-colors">
                Nos événements
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate('/services')} className="hover:text-white transition-colors">
                Nos services
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate('/galerie')} className="hover:text-white transition-colors">
                Galerie photos &amp; vidéos
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate('/reserver')} className="hover:text-white transition-colors">
                Réserver un événement
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate('/espace-client')} className="hover:text-white transition-colors">
                Espace client
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate('/admin')} className="hover:text-white transition-colors">
                Administration
              </button>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#C59B27] tracking-wide">Coordonnées</h3>
          <ul className="space-y-2.5 text-sm text-white/75">
            <li className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#C59B27] shrink-0 mt-0.5" />
              <span>{settings.address}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-[#C59B27] shrink-0" />
              <span className="tabular-nums">{settings.phone}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-[#C59B27] shrink-0" />
              <span>{settings.email}</span>
            </li>
          </ul>
          <div className="pt-2 flex flex-wrap gap-3 text-xs text-white/60">
            <a href={settings.socialLinks.instagram} target="_blank" rel="noreferrer" className="hover:text-[#C59B27]">
              Instagram
            </a>
            <span aria-hidden="true">·</span>
            <a href={settings.socialLinks.linkedin} target="_blank" rel="noreferrer" className="hover:text-[#C59B27]">
              LinkedIn
            </a>
            <span aria-hidden="true">·</span>
            <a href={settings.socialLinks.facebook} target="_blank" rel="noreferrer" className="hover:text-[#C59B27]">
              Facebook
            </a>
            <span aria-hidden="true">·</span>
            <a href={settings.socialLinks.youtube} target="_blank" rel="noreferrer" className="hover:text-[#C59B27]">
              YouTube
            </a>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#C59B27] tracking-wide">Conformité &amp; Langue</h3>
          <ul className="space-y-2 text-xs text-white/70">
            <li>
              <button type="button" onClick={() => onNavigate('/mentions-legales')} className="hover:text-white">
                Mentions légales
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate('/confidentialite')} className="hover:text-white">
                Politique de confidentialité (Loi 09-08 / CNDP)
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate('/cgu')} className="hover:text-white">
                Conditions générales d’utilisation
              </button>
            </li>
            <li>
              <button type="button" onClick={() => onNavigate('/conditions-reservation')} className="hover:text-white">
                Conditions de réservation &amp; annulation
              </button>
            </li>
          </ul>
          <div className="pt-3">
            <div className="inline-flex items-center gap-1 p-1 bg-white/10 rounded-md">
              {(['fr', 'ar', 'en'] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                    lang === code ? 'bg-[#C59B27] text-[#0A0A0B]' : 'text-white/75 hover:text-white'
                  }`}
                >
                  {code === 'fr' ? 'FR' : code === 'ar' ? 'العربية' : 'EN'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/55">
          <span>© {new Date().getFullYear()} {settings.companyName}. Casablanca, Maroc.</span>
          <span>Devise : Dirham Marocain (MAD / DH)</span>
        </div>
      </div>
    </footer>
  );
}
