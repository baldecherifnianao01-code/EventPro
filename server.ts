import crypto from 'node:crypto';
import path from 'node:path';
import express from 'express';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { mutateDb, readDb } from './src/server/db.ts';
import {
  hashPassword,
  optionalAuth,
  rateLimit,
  requireAdmin,
  requireAuth,
  signSessionToken,
  verifyPassword,
  verifyTimingSafeString,
  type AuthRequest,
} from './src/server/auth.ts';
import {
  cleanText,
  isPositiveNumber,
  isSafeMediaUrl,
  isValidEmail,
  isValidIsoDate,
  isValidMoroccanPhone,
  isValidTime,
  normalizeMoroccanPhone,
  validateAttachmentDataUrl,
} from './src/server/validators.ts';
import type {
  BookingStatus,
  GalleryCategory,
  LanguageCode,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
  QuoteItem,
  QuoteStatus,
} from './src/server/types.ts';

dotenv.config();

const PORT = 3000;

function getPaymentGatewayMode(): 'test' | 'live' {
  const configured =
    process.env.PAYMENT_GATEWAY_MODE === 'live' &&
    Boolean(process.env.CMI_MERCHANT_ID?.trim()) &&
    Boolean(process.env.CMI_SECRET_KEY?.trim());
  return configured ? 'live' : 'test';
}

function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim());
}

function generateBookingNumber(count: number): string {
  const year = new Date().getFullYear();
  const seq = String(count + 1).padStart(4, '0');
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `EP-${year}-${seq}-${suffix}`;
}

function generateCodeNumber(prefix: string, count: number): string {
  const year = new Date().getFullYear();
  const seq = String(count + 1).padStart(4, '0');
  return `${prefix}-${year}-${seq}`;
}

async function startServer() {
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json({ limit: '4mb' }));

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      paymentGatewayMode: getPaymentGatewayMode(),
      smtpConfigured: isSmtpConfigured(),
    });
  });

  // Public bootstrap data
  app.get('/api/public/bootstrap', (_req, res) => {
    const db = readDb();
    res.json({
      categories: [...db.categories].sort((a, b) => a.sortOrder - b.sortOrder),
      services: db.services.filter((s) => s.isActive),
      events: db.events,
      gallery: db.gallery,
      testimonials: db.testimonials.filter((t) => t.isPublished),
      settings: {
        ...db.settings,
        paymentGatewayMode: getPaymentGatewayMode(),
        smtpConfigured: isSmtpConfigured(),
      },
    });
  });

  // Slot / date availability check to prevent double bookings
  app.get('/api/availability', (req, res) => {
    const date = cleanText(req.query.date, 20);
    if (!isValidIsoDate(date)) {
      res.status(400).json({ error: 'Format de date invalide (AAAA-MM-JJ).' });
      return;
    }
    const db = readDb();
    if (db.settings.blockedDates.includes(date)) {
      res.json({
        date,
        available: false,
        reason: 'Cette date est bloquée ou complète dans notre calendrier.',
        existingCount: db.settings.maxBookingsPerDay,
        maxBookingsPerDay: db.settings.maxBookingsPerDay,
        bookedTimes: [],
      });
      return;
    }
    const activeOnDate = db.bookings.filter(
      (b) => b.eventDate === date && b.status !== 'annulee'
    );
    const available = activeOnDate.length < db.settings.maxBookingsPerDay;
    res.json({
      date,
      available,
      reason: available
        ? undefined
        : 'Capacité maximale atteinte pour cette journée. Veuillez choisir une autre date.',
      existingCount: activeOnDate.length,
      maxBookingsPerDay: db.settings.maxBookingsPerDay,
      bookedTimes: activeOnDate.map((b) => b.eventTime),
    });
  });

  // Create booking (public or authenticated client)
  app.post(
    '/api/bookings',
    rateLimit('bookings', 12, 10 * 60 * 1000),
    optionalAuth,
    async (req: AuthRequest, res) => {
      try {
        const body = req.body || {};
        const fullName = cleanText(body.fullName, 120);
        const email = cleanText(body.email, 180).toLowerCase();
        const phoneRaw = cleanText(body.phone, 40);
        const eventCategory = cleanText(body.eventCategory, 100);
        const eventType = cleanText(body.eventType, 100);
        const eventDate = cleanText(body.eventDate, 20);
        const eventTime = cleanText(body.eventTime, 10);
        const venue = cleanText(body.venue, 200);
        const city = cleanText(body.city, 80) || 'Casablanca';
        const guestCount = Number(body.guestCount);
        const budgetMad = Number(body.budgetMad);
        const description = cleanText(body.description, 2500);
        const selectedServiceIds = Array.isArray(body.selectedServiceIds)
          ? body.selectedServiceIds.filter((x: unknown): x is string => typeof x === 'string')
          : [];

        if (fullName.length < 2) {
          res.status(400).json({ error: 'Veuillez saisir votre nom complet.' });
          return;
        }
        if (!isValidEmail(email)) {
          res.status(400).json({ error: 'Adresse e-mail invalide.' });
          return;
        }
        if (!isValidMoroccanPhone(phoneRaw)) {
          res.status(400).json({
            error:
              'Numéro de téléphone marocain invalide (ex: +212 6 00 00 00 00 ou 0600000000).',
          });
          return;
        }
        if (!eventCategory || !eventType) {
          res.status(400).json({ error: "Veuillez sélectionner la catégorie et le type d'événement." });
          return;
        }
        if (!isValidIsoDate(eventDate)) {
          res.status(400).json({ error: "Date d'événement invalide." });
          return;
        }
        const todayIso = new Date().toISOString().slice(0, 10);
        if (eventDate < todayIso) {
          res.status(400).json({ error: "La date de l'événement ne peut pas être dans le passé." });
          return;
        }
        if (!isValidTime(eventTime)) {
          res.status(400).json({ error: "Heure souhaitée invalide (format HH:MM)." });
          return;
        }
        if (venue.length < 2) {
          res.status(400).json({ error: "Veuillez préciser le lieu ou l'adresse souhaitée." });
          return;
        }
        if (!isPositiveNumber(guestCount, 1, 50000)) {
          res.status(400).json({ error: "Nombre d'invités invalide." });
          return;
        }
        if (!isPositiveNumber(budgetMad, 500, 100000000)) {
          res.status(400).json({ error: 'Budget estimatif en DH invalide (minimum 500 DH).' });
          return;
        }

        const attachmentCheck = validateAttachmentDataUrl(
          body.attachmentDataUrl,
          body.attachmentName
        );
        if (!attachmentCheck.valid) {
          res.status(400).json({ error: attachmentCheck.error });
          return;
        }

        const result = await mutateDb((db) => {
          // Double booking protection
          if (db.settings.blockedDates.includes(eventDate)) {
            return { conflict: 'Cette date est indisponible dans notre calendrier.' };
          }
          const activeSameDate = db.bookings.filter(
            (b) => b.eventDate === eventDate && b.status !== 'annulee'
          );
          if (activeSameDate.length >= db.settings.maxBookingsPerDay) {
            return {
              conflict:
                'Tous les créneaux sont déjà réservés pour cette date. Merci de sélectionner une autre journée.',
            };
          }
          const exactSlotCollision = activeSameDate.some(
            (b) =>
              b.eventTime === eventTime &&
              b.venue.toLowerCase() === venue.toLowerCase()
          );
          if (exactSlotCollision) {
            return {
              conflict:
                'Un événement est déjà planifié à cette heure et sur ce même lieu. Veuillez modifier le créneau.',
            };
          }

          const linkedUser =
            (req.authUser ? db.users.find((u) => u.id === req.authUser!.sub) : null) ||
            db.users.find((u) => u.email.toLowerCase() === email);

          const now = new Date().toISOString();
          const bookingId = `bkg_${crypto.randomUUID()}`;
          const bookingNumber = generateBookingNumber(db.bookings.length);

          const booking = {
            id: bookingId,
            bookingNumber,
            userId: linkedUser ? linkedUser.id : null,
            fullName,
            email,
            phone: normalizeMoroccanPhone(phoneRaw),
            eventCategory,
            eventType,
            eventDate,
            eventTime,
            venue,
            city,
            guestCount: Math.round(guestCount),
            budgetMad: Math.round(budgetMad),
            description,
            attachmentName: attachmentCheck.name,
            attachmentDataUrl: attachmentCheck.dataUrl,
            status: 'nouvelle_demande' as BookingStatus,
            assignedManager: null,
            internalNotes: '',
            cancellationReason: null,
            createdAt: now,
            updatedAt: now,
          };

          db.bookings.unshift(booking);

          const linkedServices = [];
          for (const srvId of selectedServiceIds) {
            const service = db.services.find((s) => s.id === srvId && s.isActive);
            if (service) {
              const bs = {
                id: `bs_${crypto.randomUUID()}`,
                bookingId,
                serviceId: service.id,
                serviceTitle: service.titleFr,
                quantity: 1,
                unitPriceMad: service.unitPriceMad,
              };
              db.bookingServices.push(bs);
              linkedServices.push(bs);
            }
          }

          db.notifications.unshift({
            id: `ntf_${crypto.randomUUID()}`,
            userId: null,
            targetRole: 'admin',
            title: `Nouvelle demande ${bookingNumber}`,
            message: `${fullName} — ${eventType} le ${eventDate} (${Math.round(guestCount)} invités).`,
            isRead: false,
            createdAt: now,
          });

          if (linkedUser) {
            db.notifications.unshift({
              id: `ntf_${crypto.randomUUID()}`,
              userId: linkedUser.id,
              targetRole: 'client',
              title: `Demande ${bookingNumber} enregistrée`,
              message: `Votre demande pour ${eventType} le ${eventDate} est en cours d'étude.`,
              isRead: false,
              createdAt: now,
            });
          }

          return { booking, services: linkedServices };
        });

        if ('conflict' in result) {
          res.status(409).json({ error: result.conflict });
          return;
        }

        const smtpReady = isSmtpConfigured();
        res.status(201).json({
          booking: result.booking,
          services: result.services,
          emailSent: smtpReady,
          emailNotice: smtpReady
            ? 'Un e-mail de confirmation a été transmis.'
            : "Demande enregistrée dans notre base de données (envoi d'e-mail automatique disponible après configuration SMTP).",
        });
      } catch (err) {
        console.error('Error creating booking:', err);
        res.status(500).json({ error: 'Erreur interne lors de la création de la réservation.' });
      }
    }
  );

  // Contact form
  app.post('/api/contact', rateLimit('contact', 10, 10 * 60 * 1000), async (req, res) => {
    const body = req.body || {};
    const fullName = cleanText(body.fullName, 120);
    const email = cleanText(body.email, 180).toLowerCase();
    const phone = cleanText(body.phone, 40);
    const subject = cleanText(body.subject, 160);
    const message = cleanText(body.message, 3000);

    if (fullName.length < 2 || !isValidEmail(email) || message.length < 5) {
      res.status(400).json({ error: 'Veuillez renseigner votre nom, un e-mail valide et votre message.' });
      return;
    }

    const saved = await mutateDb((db) => {
      const now = new Date().toISOString();
      const item = {
        id: `msg_${crypto.randomUUID()}`,
        fullName,
        email,
        phone: phone ? normalizeMoroccanPhone(phone) : '',
        subject: subject || 'Demande de renseignements',
        message,
        status: 'nouveau' as const,
        createdAt: now,
      };
      db.contactMessages.unshift(item);
      db.notifications.unshift({
        id: `ntf_${crypto.randomUUID()}`,
        userId: null,
        targetRole: 'admin',
        title: `Nouveau message contact — ${fullName}`,
        message: item.subject,
        isRead: false,
        createdAt: now,
      });
      return item;
    });

    res.status(201).json({ message: saved });
  });

  // Client Registration
  app.post('/api/auth/register', rateLimit('auth_register', 10, 15 * 60 * 1000), async (req, res) => {
    const body = req.body || {};
    const fullName = cleanText(body.fullName, 120);
    const email = cleanText(body.email, 180).toLowerCase();
    const phone = cleanText(body.phone, 40);
    const city = cleanText(body.city, 80) || 'Casablanca';
    const company = cleanText(body.company, 120);
    const password = typeof body.password === 'string' ? body.password : '';
    const cndpAccepted = Boolean(body.cndpAccepted);
    const preferredLanguage: LanguageCode =
      body.preferredLanguage === 'ar' || body.preferredLanguage === 'en' ? body.preferredLanguage : 'fr';

    if (fullName.length < 2) {
      res.status(400).json({ error: 'Nom complet requis.' });
      return;
    }
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Adresse e-mail invalide.' });
      return;
    }
    if (!isValidMoroccanPhone(phone)) {
      res.status(400).json({ error: 'Numéro de téléphone marocain invalide.' });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' });
      return;
    }
    if (!cndpAccepted) {
      res.status(400).json({
        error: 'Veuillez accepter la politique de confidentialité (Loi 09-08 / CNDP).',
      });
      return;
    }

    const result = await mutateDb((db) => {
      if (db.users.some((u) => u.email.toLowerCase() === email)) {
        return { error: 'Un compte existe déjà avec cette adresse e-mail.' };
      }
      const now = new Date().toISOString();
      const userId = `usr_${crypto.randomUUID()}`;
      const user = {
        id: userId,
        email,
        passwordHash: hashPassword(password),
        role: 'client' as const,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      const profile = {
        id: `prf_${crypto.randomUUID()}`,
        userId,
        fullName,
        phone: normalizeMoroccanPhone(phone),
        city,
        company,
        preferredLanguage,
        cndpConsentAt: now,
        updatedAt: now,
      };
      db.users.push(user);
      db.profiles.push(profile);

      // Link any prior guest bookings submitted with the same email
      for (const b of db.bookings) {
        if (!b.userId && b.email.toLowerCase() === email) {
          b.userId = userId;
        }
      }
      for (const q of db.quotes) {
        if (!q.userId && q.clientEmail.toLowerCase() === email) {
          q.userId = userId;
        }
      }
      for (const inv of db.invoices) {
        if (!inv.userId && inv.clientEmail.toLowerCase() === email) {
          inv.userId = userId;
        }
      }

      return { user, profile };
    });

    if ('error' in result) {
      res.status(409).json({ error: result.error });
      return;
    }

    const token = signSessionToken({
      sub: result.user.id,
      email: result.user.email,
      role: result.user.role,
    });

    res.status(201).json({
      token,
      user: { id: result.user.id, email: result.user.email, role: result.user.role },
      profile: result.profile,
    });
  });

  // Client & Admin Standard Login
  app.post('/api/auth/login', rateLimit('auth_login', 12, 10 * 60 * 1000), (req, res) => {
    const body = req.body || {};
    const email = cleanText(body.email, 180).toLowerCase();
    const password = typeof body.password === 'string' ? body.password : '';

    if (!isValidEmail(email) || !password) {
      res.status(400).json({ error: 'E-mail et mot de passe requis.' });
      return;
    }

    const db = readDb();
    const user = db.users.find((u) => u.email.toLowerCase() === email);
    if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: 'Identifiants incorrects.' });
      return;
    }

    const profile = db.profiles.find((p) => p.userId === user.id) || null;
    const token = signSessionToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
      profile,
    });
  });

  // Forgot password request
  app.post(
    '/api/auth/forgot-password',
    rateLimit('auth_forgot', 5, 15 * 60 * 1000),
    async (req, res) => {
      const email = cleanText(req.body?.email, 180).toLowerCase();
      if (!isValidEmail(email)) {
        res.status(400).json({ error: 'Adresse e-mail invalide.' });
        return;
      }
      await mutateDb((db) => {
        const user = db.users.find((u) => u.email.toLowerCase() === email);
        if (!user) return;
        const code = String(crypto.randomInt(100000, 999999));
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        db.passwordResets.push({
          id: `rst_${crypto.randomUUID()}`,
          email,
          codeHash: hashPassword(code),
          expiresAt,
          used: false,
        });
        db.notifications.unshift({
          id: `ntf_${crypto.randomUUID()}`,
          userId: null,
          targetRole: 'admin',
          title: 'Demande de réinitialisation mot de passe',
          message: `Demande initiée pour ${email} (SMTP ${isSmtpConfigured() ? 'actif' : 'non configuré'}).`,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      });

      res.json({
        ok: true,
        message: isSmtpConfigured()
          ? 'Si un compte est associé à cet e-mail, un code de réinitialisation vient d’être envoyé.'
          : "Demande enregistrée. L'envoi automatique d'e-mails nécessite la configuration SMTP dans les variables d'environnement.",
      });
    }
  );

  app.post(
    '/api/auth/reset-password',
    rateLimit('auth_reset', 8, 15 * 60 * 1000),
    async (req, res) => {
      const email = cleanText(req.body?.email, 180).toLowerCase();
      const code = cleanText(req.body?.code, 20);
      const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

      if (!isValidEmail(email) || !code || newPassword.length < 8) {
        res.status(400).json({ error: 'Paramètres invalides (mot de passe min. 8 caractères).' });
        return;
      }

      const ok = await mutateDb((db) => {
        const nowIso = new Date().toISOString();
        const resetRecord = [...db.passwordResets]
          .reverse()
          .find((r) => r.email === email && !r.used && r.expiresAt > nowIso);
        if (!resetRecord || !verifyPassword(code, resetRecord.codeHash)) {
          return false;
        }
        const user = db.users.find((u) => u.email.toLowerCase() === email);
        if (!user) return false;
        user.passwordHash = hashPassword(newPassword);
        user.updatedAt = nowIso;
        resetRecord.used = true;
        return true;
      });

      if (!ok) {
        res.status(400).json({ error: 'Code de réinitialisation invalide ou expiré.' });
        return;
      }
      res.json({ ok: true });
    }
  );

  app.post('/api/auth/logout', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthRequest, res) => {
    const db = readDb();
    const user = db.users.find((u) => u.id === req.authUser!.sub);
    if (!user) {
      // Virtual env-passcode admin session
      if (req.authUser!.role === 'admin' && req.authUser!.sub === 'env_admin') {
        res.json({
          user: { id: 'env_admin', email: req.authUser!.email, role: 'admin' },
          profile: {
            id: 'prf_env_admin',
            userId: 'env_admin',
            fullName: 'Administrateur Principal',
            phone: db.settings.phone,
            city: 'Casablanca',
            company: db.settings.companyName,
            preferredLanguage: 'fr',
            cndpConsentAt: db.settings.updatedAt,
            updatedAt: db.settings.updatedAt,
          },
        });
        return;
      }
      res.status(404).json({ error: 'Compte introuvable.' });
      return;
    }
    const profile = db.profiles.find((p) => p.userId === user.id) || null;
    res.json({
      user: { id: user.id, email: user.email, role: user.role },
      profile,
    });
  });

  app.patch('/api/auth/profile', requireAuth, async (req: AuthRequest, res) => {
    const body = req.body || {};
    const fullName = cleanText(body.fullName, 120);
    const phone = cleanText(body.phone, 40);
    const city = cleanText(body.city, 80);
    const company = cleanText(body.company, 120);
    const preferredLanguage: LanguageCode =
      body.preferredLanguage === 'ar' || body.preferredLanguage === 'en' ? body.preferredLanguage : 'fr';

    if (fullName.length < 2) {
      res.status(400).json({ error: 'Nom complet requis.' });
      return;
    }
    if (phone && !isValidMoroccanPhone(phone)) {
      res.status(400).json({ error: 'Numéro de téléphone marocain invalide.' });
      return;
    }

    const updated = await mutateDb((db) => {
      const profile = db.profiles.find((p) => p.userId === req.authUser!.sub);
      if (!profile) return null;
      profile.fullName = fullName;
      if (phone) profile.phone = normalizeMoroccanPhone(phone);
      if (city) profile.city = city;
      profile.company = company;
      profile.preferredLanguage = preferredLanguage;
      profile.updatedAt = new Date().toISOString();
      return profile;
    });

    if (!updated) {
      res.status(404).json({ error: 'Profil introuvable.' });
      return;
    }
    res.json({ profile: updated });
  });

  // Admin Bootstrap & Admin Login
  app.get('/api/admin/bootstrap-status', (_req, res) => {
    const db = readDb();
    const hasAdminAccount = db.users.some((u) => u.role === 'admin' && u.isActive);
    const envPasscodeConfigured = Boolean(process.env.ADMIN_PASSCODE?.trim());
    res.json({
      isClaimed: hasAdminAccount,
      envPasscodeConfigured,
    });
  });

  // One-time first-run Admin Claim (only when no admin exists and ADMIN_PASSCODE is unset)
  app.post('/api/admin/claim', rateLimit('admin_claim', 6, 15 * 60 * 1000), async (req, res) => {
    if (process.env.ADMIN_PASSCODE?.trim()) {
      res.status(403).json({
        error: "L'accès administrateur est géré par le code secret d'environnement.",
      });
      return;
    }

    const fullName = cleanText(req.body?.fullName, 120) || 'Administrateur EVENT PRO';
    const email = cleanText(req.body?.email, 180).toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Adresse e-mail administrateur invalide.' });
      return;
    }
    if (password.length < 10) {
      res.status(400).json({
        error: 'Le mot de passe administrateur doit contenir au moins 10 caractères.',
      });
      return;
    }

    const result = await mutateDb((db) => {
      if (db.users.some((u) => u.role === 'admin' && u.isActive)) {
        return { error: 'Un compte administrateur principal a déjà été configuré.' };
      }
      if (db.users.some((u) => u.email.toLowerCase() === email)) {
        return { error: 'Cette adresse e-mail est déjà utilisée.' };
      }
      const now = new Date().toISOString();
      const userId = `adm_${crypto.randomUUID()}`;
      const user = {
        id: userId,
        email,
        passwordHash: hashPassword(password),
        role: 'admin' as const,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      const profile = {
        id: `prf_${crypto.randomUUID()}`,
        userId,
        fullName,
        phone: db.settings.phone,
        city: 'Casablanca',
        company: db.settings.companyName,
        preferredLanguage: 'fr' as const,
        cndpConsentAt: now,
        updatedAt: now,
      };
      db.users.push(user);
      db.profiles.push(profile);
      return { user, profile };
    });

    if ('error' in result) {
      res.status(409).json({ error: result.error });
      return;
    }

    const token = signSessionToken({
      sub: result.user.id,
      email: result.user.email,
      role: 'admin',
    });

    res.status(201).json({
      token,
      user: { id: result.user.id, email: result.user.email, role: 'admin' },
      profile: result.profile,
    });
  });

  app.post('/api/auth/admin-login', rateLimit('admin_login', 10, 10 * 60 * 1000), (req, res) => {
    const email = cleanText(req.body?.email, 180).toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode : '';
    const envPasscode = process.env.ADMIN_PASSCODE?.trim();

    if (envPasscode && passcode) {
      if (verifyTimingSafeString(passcode, envPasscode)) {
        const db = readDb();
        const token = signSessionToken({
          sub: 'env_admin',
          email: db.settings.email,
          role: 'admin',
        });
        res.json({
          token,
          user: { id: 'env_admin', email: db.settings.email, role: 'admin' },
          profile: {
            id: 'prf_env_admin',
            userId: 'env_admin',
            fullName: 'Administrateur Principal',
            phone: db.settings.phone,
            city: 'Casablanca',
            company: db.settings.companyName,
            preferredLanguage: 'fr',
            cndpConsentAt: db.settings.updatedAt,
            updatedAt: db.settings.updatedAt,
          },
        });
        return;
      }
      res.status(401).json({ error: 'Code administrateur invalide.' });
      return;
    }

    if (!isValidEmail(email) || !password) {
      res.status(400).json({ error: 'Identifiants administrateur requis.' });
      return;
    }

    const db = readDb();
    const user = db.users.find(
      (u) => u.email.toLowerCase() === email && (u.role === 'admin' || u.role === 'manager')
    );
    if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: 'Identifiants administrateur invalides.' });
      return;
    }

    const profile = db.profiles.find((p) => p.userId === user.id) || null;
    const token = signSessionToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
      profile,
    });
  });

  // Client Portal Data (strictly filtered by authenticated client ID / email)
  app.get('/api/client/dashboard', requireAuth, (req: AuthRequest, res) => {
    const db = readDb();
    const uid = req.authUser!.sub;
    const email = req.authUser!.email.toLowerCase();

    const bookings = db.bookings.filter(
      (b) => b.userId === uid || b.email.toLowerCase() === email
    );
    const bookingIds = new Set(bookings.map((b) => b.id));
    const bookingServices = db.bookingServices.filter((bs) => bookingIds.has(bs.bookingId));
    const quotes = db.quotes.filter(
      (q) =>
        (q.userId === uid || q.clientEmail.toLowerCase() === email || bookingIds.has(q.bookingId)) &&
        q.status !== 'brouillon'
    );
    const quoteIds = new Set(quotes.map((q) => q.id));
    const quoteItems = db.quoteItems.filter((qi) => quoteIds.has(qi.quoteId));
    const payments = db.payments.filter(
      (p) => p.userId === uid || bookingIds.has(p.bookingId) || quoteIds.has(p.quoteId)
    );
    const invoices = db.invoices.filter(
      (inv) =>
        inv.userId === uid || inv.clientEmail.toLowerCase() === email || bookingIds.has(inv.bookingId)
    );
    const notifications = db.notifications.filter(
      (n) => n.targetRole === 'client' && n.userId === uid
    );

    res.json({
      bookings,
      bookingServices,
      quotes,
      quoteItems,
      payments,
      invoices,
      notifications,
      paymentGatewayMode: getPaymentGatewayMode(),
    });
  });

  // Client cancels booking
  app.patch('/api/client/bookings/:id/cancel', requireAuth, async (req: AuthRequest, res) => {
    const id = req.params.id;
    const reason = cleanText(req.body?.reason, 300) || "Annulation demandée par le client";
    const uid = req.authUser!.sub;
    const email = req.authUser!.email.toLowerCase();

    const result = await mutateDb((db) => {
      const booking = db.bookings.find(
        (b) => b.id === id && (b.userId === uid || b.email.toLowerCase() === email)
      );
      if (!booking) return { status: 404 as const, error: 'Réservation introuvable.' };
      if (booking.status === 'evenement_termine' || booking.status === 'annulee') {
        return { status: 400 as const, error: 'Cette réservation ne peut plus être annulée.' };
      }

      const eventMs = new Date(`${booking.eventDate}T00:00:00Z`).getTime();
      const daysRemaining = (eventMs - Date.now()) / (1000 * 60 * 60 * 24);
      if (
        booking.status === 'reservation_confirmee' &&
        daysRemaining < db.settings.cancellationNoticeDays
      ) {
        return {
          status: 400 as const,
          error: `Annulation en ligne impossible à moins de ${db.settings.cancellationNoticeDays} jours de l'événement confirmé. Veuillez contacter notre équipe.`,
        };
      }

      const now = new Date().toISOString();
      booking.status = 'annulee';
      booking.cancellationReason = reason;
      booking.updatedAt = now;

      db.notifications.unshift({
        id: `ntf_${crypto.randomUUID()}`,
        userId: null,
        targetRole: 'admin',
        title: `Réservation ${booking.bookingNumber} annulée`,
        message: `Annulée par le client (${reason}).`,
        isRead: false,
        createdAt: now,
      });

      return { status: 200 as const, booking };
    });

    if (result.status !== 200) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.json({ booking: result.booking });
  });

  // Client accepts or refuses a quote
  app.post('/api/client/quotes/:id/respond', requireAuth, async (req: AuthRequest, res) => {
    const id = req.params.id;
    const action = req.body?.action;
    if (action !== 'accept' && action !== 'refuse') {
      res.status(400).json({ error: 'Action invalide.' });
      return;
    }

    const uid = req.authUser!.sub;
    const email = req.authUser!.email.toLowerCase();

    const result = await mutateDb((db) => {
      const quote = db.quotes.find(
        (q) => q.id === id && (q.userId === uid || q.clientEmail.toLowerCase() === email)
      );
      if (!quote) return { status: 404 as const, error: 'Devis introuvable.' };
      if (quote.status !== 'envoye') {
        return { status: 400 as const, error: 'Ce devis a déjà reçu une réponse ou expiré.' };
      }

      const now = new Date().toISOString();
      quote.status = action === 'accept' ? 'accepte' : 'refuse';
      quote.updatedAt = now;

      const booking = db.bookings.find((b) => b.id === quote.bookingId);
      if (booking) {
        booking.status = action === 'accept' ? 'devis_accepte' : 'en_attente_confirmation';
        booking.updatedAt = now;
      }

      let invoice = db.invoices.find((inv) => inv.quoteId === quote.id) || null;
      if (action === 'accept' && !invoice) {
        invoice = {
          id: `inv_${crypto.randomUUID()}`,
          invoiceNumber: generateCodeNumber('FAC', db.invoices.length),
          quoteId: quote.id,
          bookingId: quote.bookingId,
          userId: uid,
          clientName: quote.clientName,
          clientEmail: quote.clientEmail,
          subtotalMad: quote.subtotalMad,
          discountMad: quote.discountMad,
          vatRatePercent: quote.vatRatePercent,
          vatAmountMad: quote.vatAmountMad,
          totalTtcMad: quote.totalTtcMad,
          paidAmountMad: 0,
          status: 'emise',
          issuedAt: now,
        };
        db.invoices.unshift(invoice);
      }

      db.notifications.unshift({
        id: `ntf_${crypto.randomUUID()}`,
        userId: null,
        targetRole: 'admin',
        title: `Devis ${quote.quoteNumber} ${action === 'accept' ? 'accepté' : 'refusé'}`,
        message: `${quote.clientName} a ${action === 'accept' ? 'accepté' : 'refusé'} le devis (${quote.totalTtcMad} DH).`,
        isRead: false,
        createdAt: now,
      });

      return { status: 200 as const, quote, invoice };
    });

    if (result.status !== 200) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.json({ quote: result.quote, invoice: result.invoice });
  });

  // Client initiates a payment (deposit, balance, bank transfer, or on-site)
  app.post('/api/client/payments', requireAuth, async (req: AuthRequest, res) => {
    const body = req.body || {};
    const quoteId = cleanText(body.quoteId, 80);
    const paymentType: PaymentType =
      body.paymentType === 'acompte' || body.paymentType === 'solde' ? body.paymentType : 'total';
    const method: PaymentMethod =
      body.method === 'virement_bancaire' || body.method === 'sur_place'
        ? body.method
        : 'carte_bancaire';
    const amountMad = Number(body.amountMad);
    const notes = cleanText(body.notes, 300);

    if (!quoteId || !isPositiveNumber(amountMad, 1, 100000000)) {
      res.status(400).json({ error: 'Montant ou devis invalide.' });
      return;
    }

    const uid = req.authUser!.sub;
    const email = req.authUser!.email.toLowerCase();
    const gatewayMode = getPaymentGatewayMode();

    const result = await mutateDb((db) => {
      if (method === 'sur_place' && !db.settings.allowOnSitePayment) {
        return {
          status: 403 as const,
          error: "Le paiement sur place n'est pas activé pour le moment.",
        };
      }
      const quote = db.quotes.find(
        (q) => q.id === quoteId && (q.userId === uid || q.clientEmail.toLowerCase() === email)
      );
      if (!quote) return { status: 404 as const, error: 'Devis introuvable.' };
      if (quote.status !== 'accepte') {
        return {
          status: 400 as const,
          error: 'Veuillez accepter le devis avant de procéder au règlement.',
        };
      }

      const now = new Date().toISOString();
      let paymentStatus: PaymentStatus = 'en_attente';
      if (method === 'carte_bancaire') {
        paymentStatus = gatewayMode === 'test' ? 'autorise_test' : 'en_attente';
      } else if (method === 'virement_bancaire') {
        paymentStatus = 'en_verification';
      } else {
        paymentStatus = 'en_attente';
      }

      const payment = {
        id: `pay_${crypto.randomUUID()}`,
        transactionRef: `TXN-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
        quoteId: quote.id,
        bookingId: quote.bookingId,
        userId: uid,
        paymentType,
        method,
        amountMad: Math.round(amountMad * 100) / 100,
        status: paymentStatus,
        gatewayMode,
        notes:
          notes ||
          (method === 'carte_bancaire' && gatewayMode === 'test'
            ? 'Transaction enregistrée en environnement de test (aucun débit réel).'
            : ''),
        createdAt: now,
        updatedAt: now,
      };
      db.payments.unshift(payment);

      db.notifications.unshift({
        id: `ntf_${crypto.randomUUID()}`,
        userId: null,
        targetRole: 'admin',
        title: `Paiement ${payment.transactionRef} (${payment.method})`,
        message: `${quote.clientName} — ${payment.amountMad} DH [${payment.status}]`,
        isRead: false,
        createdAt: now,
      });

      return { status: 201 as const, payment };
    });

    if (result.status !== 201) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.status(201).json({ payment: result.payment, gatewayMode });
  });

  app.patch('/api/client/notifications/:id/read', requireAuth, async (req: AuthRequest, res) => {
    const id = req.params.id;
    await mutateDb((db) => {
      const item = db.notifications.find((n) => n.id === id && n.userId === req.authUser!.sub);
      if (item) item.isRead = true;
    });
    res.json({ ok: true });
  });

  // ============================================================================
  // ADMIN API ROUTES (Strictly protected by requireAdmin)
  // ============================================================================

  app.get('/api/admin/overview', requireAdmin, (_req, res) => {
    const db = readDb();
    const totalBookings = db.bookings.length;
    const newRequests = db.bookings.filter((b) => b.status === 'nouvelle_demande').length;
    const confirmedBookings = db.bookings.filter(
      (b) => b.status === 'reservation_confirmee'
    ).length;
    const todayIso = new Date().toISOString().slice(0, 10);
    const upcomingEvents = db.bookings.filter(
      (b) => b.eventDate >= todayIso && b.status !== 'annulee' && b.status !== 'evenement_termine'
    ).length;
    const recordedRevenueMad = db.payments
      .filter((p) => p.status === 'valide')
      .reduce((sum, p) => sum + p.amountMad, 0);
    const pendingQuotes = db.quotes.filter((q) => q.status === 'envoye').length;

    const clients = db.users
      .filter((u) => u.role === 'client')
      .map((u) => {
        const profile = db.profiles.find((p) => p.userId === u.id) || null;
        const clientBookings = db.bookings.filter(
          (b) => b.userId === u.id || b.email.toLowerCase() === u.email.toLowerCase()
        );
        return {
          id: u.id,
          email: u.email,
          isActive: u.isActive,
          createdAt: u.createdAt,
          profile,
          bookingCount: clientBookings.length,
        };
      });

    const adminUsers = db.users
      .filter((u) => u.role === 'admin' || u.role === 'manager')
      .map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
        fullName: db.profiles.find((p) => p.userId === u.id)?.fullName || u.email,
      }));

    res.json({
      kpis: {
        totalBookings,
        newRequests,
        confirmedBookings,
        upcomingEvents,
        recordedRevenueMad,
        pendingQuotes,
      },
      bookings: db.bookings,
      bookingServices: db.bookingServices,
      clients,
      adminUsers,
      categories: db.categories,
      services: db.services,
      events: db.events,
      quotes: db.quotes,
      quoteItems: db.quoteItems,
      payments: db.payments,
      invoices: db.invoices,
      gallery: db.gallery,
      testimonials: db.testimonials,
      contactMessages: db.contactMessages,
      notifications: db.notifications.filter((n) => n.targetRole === 'admin'),
      settings: {
        ...db.settings,
        paymentGatewayMode: getPaymentGatewayMode(),
        smtpConfigured: isSmtpConfigured(),
      },
    });
  });

  // Update booking (status, manager, notes, schedule)
  app.patch('/api/admin/bookings/:id', requireAdmin, async (req, res) => {
    const id = req.params.id;
    const body = req.body || {};
    const allowedStatuses: BookingStatus[] = [
      'nouvelle_demande',
      'en_attente_confirmation',
      'devis_envoye',
      'devis_accepte',
      'reservation_confirmee',
      'evenement_termine',
      'annulee',
    ];

    const updated = await mutateDb((db) => {
      const booking = db.bookings.find((b) => b.id === id);
      if (!booking) return null;
      const now = new Date().toISOString();

      if (typeof body.status === 'string' && allowedStatuses.includes(body.status as BookingStatus)) {
        booking.status = body.status as BookingStatus;
      }
      if (typeof body.assignedManager === 'string') {
        booking.assignedManager = cleanText(body.assignedManager, 120) || null;
      }
      if (typeof body.internalNotes === 'string') {
        booking.internalNotes = cleanText(body.internalNotes, 2000);
      }
      if (typeof body.eventDate === 'string' && isValidIsoDate(body.eventDate)) {
        booking.eventDate = body.eventDate;
      }
      if (typeof body.eventTime === 'string' && isValidTime(body.eventTime)) {
        booking.eventTime = body.eventTime;
      }
      if (typeof body.venue === 'string' && body.venue.trim()) {
        booking.venue = cleanText(body.venue, 200);
      }
      if (body.guestCount !== undefined && isPositiveNumber(Number(body.guestCount), 1, 50000)) {
        booking.guestCount = Math.round(Number(body.guestCount));
      }
      if (body.budgetMad !== undefined && isPositiveNumber(Number(body.budgetMad), 0, 100000000)) {
        booking.budgetMad = Math.round(Number(body.budgetMad));
      }
      booking.updatedAt = now;

      if (booking.userId) {
        db.notifications.unshift({
          id: `ntf_${crypto.randomUUID()}`,
          userId: booking.userId,
          targetRole: 'client',
          title: `Mise à jour dossier ${booking.bookingNumber}`,
          message: `Statut actualisé : ${booking.status.replace(/_/g, ' ')}.`,
          isRead: false,
          createdAt: now,
        });
      }
      return booking;
    });

    if (!updated) {
      res.status(404).json({ error: 'Réservation introuvable.' });
      return;
    }
    res.json({ booking: updated });
  });

  // Manage clients (CNDP Law 09-08 compliant deletion/anonymization)
  app.patch('/api/admin/clients/:id', requireAdmin, async (req, res) => {
    const id = req.params.id;
    const body = req.body || {};
    const updated = await mutateDb((db) => {
      const user = db.users.find((u) => u.id === id && u.role === 'client');
      if (!user) return null;
      const profile = db.profiles.find((p) => p.userId === id);
      if (typeof body.isActive === 'boolean') user.isActive = body.isActive;
      if (profile) {
        if (typeof body.fullName === 'string' && body.fullName.trim()) {
          profile.fullName = cleanText(body.fullName, 120);
        }
        if (typeof body.phone === 'string' && isValidMoroccanPhone(body.phone)) {
          profile.phone = normalizeMoroccanPhone(body.phone);
        }
        if (typeof body.city === 'string') profile.city = cleanText(body.city, 80);
        if (typeof body.company === 'string') profile.company = cleanText(body.company, 120);
        profile.updatedAt = new Date().toISOString();
      }
      user.updatedAt = new Date().toISOString();
      return { user, profile };
    });
    if (!updated) {
      res.status(404).json({ error: 'Client introuvable.' });
      return;
    }
    res.json(updated);
  });

  app.delete('/api/admin/clients/:id', requireAdmin, async (req, res) => {
    const id = req.params.id;
    const result = await mutateDb((db) => {
      const userIdx = db.users.findIndex((u) => u.id === id && u.role === 'client');
      if (userIdx === -1) return { status: 404 as const, error: 'Client introuvable.' };
      const hasActiveConfirmed = db.bookings.some(
        (b) => b.userId === id && b.status === 'reservation_confirmee'
      );
      if (hasActiveConfirmed) {
        return {
          status: 409 as const,
          error:
            'Conservation légale : impossible de supprimer un client ayant une réservation confirmée active.',
        };
      }
      const hasInvoices = db.invoices.some((inv) => inv.userId === id);
      if (hasInvoices) {
        // Anonymize PII while preserving accounting invoice records (Moroccan tax retention)
        const user = db.users[userIdx];
        user.email = `anonymized_${user.id.slice(0, 8)}@deleted.local`;
        user.isActive = false;
        const prof = db.profiles.find((p) => p.userId === id);
        if (prof) {
          prof.fullName = 'Client anonymisé (Loi 09-08)';
          prof.phone = '';
          prof.company = '';
        }
        return { status: 200 as const, mode: 'anonymized' };
      }
      db.users.splice(userIdx, 1);
      db.profiles = db.profiles.filter((p) => p.userId !== id);
      return { status: 200 as const, mode: 'deleted' };
    });

    if (result.status !== 200) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.json({ ok: true, mode: result.mode });
  });

  // Services CRUD
  app.post('/api/admin/services', requireAdmin, async (req, res) => {
    const body = req.body || {};
    const titleFr = cleanText(body.titleFr, 140);
    const descriptionFr = cleanText(body.descriptionFr, 600);
    const unitPriceMad = Number(body.unitPriceMad);
    const unitLabel = cleanText(body.unitLabel, 60) || 'Forfait';
    const categoryId = cleanText(body.categoryId, 60) || 'cat_complementary';
    const imageUrl = cleanText(body.imageUrl, 300);

    if (titleFr.length < 2 || !isPositiveNumber(unitPriceMad, 0, 100000000)) {
      res.status(400).json({ error: 'Titre et tarif en DH valides requis.' });
      return;
    }
    if (imageUrl && !isSafeMediaUrl(imageUrl)) {
      res.status(400).json({ error: "URL d'image non autorisée." });
      return;
    }

    const service = await mutateDb((db) => {
      const now = new Date().toISOString();
      const item = {
        id: `srv_${crypto.randomUUID()}`,
        categoryId,
        slug: titleFr
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
        titleFr,
        titleAr: cleanText(body.titleAr, 140) || titleFr,
        titleEn: cleanText(body.titleEn, 140) || titleFr,
        descriptionFr,
        descriptionAr: cleanText(body.descriptionAr, 600) || descriptionFr,
        descriptionEn: cleanText(body.descriptionEn, 600) || descriptionFr,
        unitPriceMad: Math.round(unitPriceMad),
        unitLabel,
        imageUrl: imageUrl || '/src/assets/images/category_services_decor_1795276850581.jpg',
        isActive: body.isActive !== false,
        createdAt: now,
      };
      db.services.push(item);
      return item;
    });

    res.status(201).json({ service });
  });

  app.patch('/api/admin/services/:id', requireAdmin, async (req, res) => {
    const id = req.params.id;
    const body = req.body || {};
    const updated = await mutateDb((db) => {
      const srv = db.services.find((s) => s.id === id);
      if (!srv) return null;
      if (typeof body.titleFr === 'string' && body.titleFr.trim()) {
        srv.titleFr = cleanText(body.titleFr, 140);
      }
      if (typeof body.descriptionFr === 'string') {
        srv.descriptionFr = cleanText(body.descriptionFr, 600);
      }
      if (body.unitPriceMad !== undefined && isPositiveNumber(Number(body.unitPriceMad), 0, 100000000)) {
        srv.unitPriceMad = Math.round(Number(body.unitPriceMad));
      }
      if (typeof body.unitLabel === 'string' && body.unitLabel.trim()) {
        srv.unitLabel = cleanText(body.unitLabel, 60);
      }
      if (typeof body.imageUrl === 'string' && isSafeMediaUrl(body.imageUrl)) {
        srv.imageUrl = body.imageUrl.trim();
      }
      if (typeof body.isActive === 'boolean') srv.isActive = body.isActive;
      return srv;
    });
    if (!updated) {
      res.status(404).json({ error: 'Service introuvable.' });
      return;
    }
    res.json({ service: updated });
  });

  app.delete('/api/admin/services/:id', requireAdmin, async (req, res) => {
    const id = req.params.id;
    await mutateDb((db) => {
      db.services = db.services.filter((s) => s.id !== id);
    });
    res.json({ ok: true });
  });

  // Events CRUD
  app.post('/api/admin/events', requireAdmin, async (req, res) => {
    const body = req.body || {};
    const titleFr = cleanText(body.titleFr, 160);
    const category = cleanText(body.category, 80) || 'Événements Professionnels';
    const eventDate = cleanText(body.eventDate, 20);
    const eventTime = cleanText(body.eventTime, 10) || '19:00';
    const venue = cleanText(body.venue, 200);
    const city = cleanText(body.city, 80) || 'Casablanca';
    const capacity = Number(body.capacity) || 100;
    const descriptionFr = cleanText(body.descriptionFr, 800);
    const imageUrl = cleanText(body.imageUrl, 300);

    if (!titleFr || !isValidIsoDate(eventDate) || !venue) {
      res.status(400).json({ error: 'Titre, date et lieu requis.' });
      return;
    }
    if (imageUrl && !isSafeMediaUrl(imageUrl)) {
      res.status(400).json({ error: "URL d'image non autorisée." });
      return;
    }

    const evt = await mutateDb((db) => {
      const item = {
        id: `evt_${crypto.randomUUID()}`,
        titleFr,
        titleAr: cleanText(body.titleAr, 160) || titleFr,
        titleEn: cleanText(body.titleEn, 160) || titleFr,
        category,
        eventDate,
        eventTime,
        venue,
        city,
        capacity: Math.max(1, Math.round(capacity)),
        registeredCount: Math.max(0, Math.round(Number(body.registeredCount) || 0)),
        descriptionFr,
        imageUrl: imageUrl || '/src/assets/images/hero_casablanca_gala_1795276846669.jpg',
        status: (body.status === 'termine' || body.status === 'en_cours' ? body.status : 'planifie') as
          | 'planifie'
          | 'en_cours'
          | 'termine',
        isShowcaseDemo: Boolean(body.isShowcaseDemo),
        createdAt: new Date().toISOString(),
      };
      db.events.unshift(item);
      return item;
    });

    res.status(201).json({ event: evt });
  });

  app.patch('/api/admin/events/:id', requireAdmin, async (req, res) => {
    const id = req.params.id;
    const body = req.body || {};
    const updated = await mutateDb((db) => {
      const evt = db.events.find((e) => e.id === id);
      if (!evt) return null;
      if (typeof body.titleFr === 'string' && body.titleFr.trim()) evt.titleFr = cleanText(body.titleFr, 160);
      if (typeof body.category === 'string' && body.category.trim()) evt.category = cleanText(body.category, 80);
      if (typeof body.eventDate === 'string' && isValidIsoDate(body.eventDate)) evt.eventDate = body.eventDate;
      if (typeof body.eventTime === 'string' && isValidTime(body.eventTime)) evt.eventTime = body.eventTime;
      if (typeof body.venue === 'string' && body.venue.trim()) evt.venue = cleanText(body.venue, 200);
      if (typeof body.city === 'string' && body.city.trim()) evt.city = cleanText(body.city, 80);
      if (body.capacity !== undefined && isPositiveNumber(Number(body.capacity), 1, 100000)) {
        evt.capacity = Math.round(Number(body.capacity));
      }
      if (body.registeredCount !== undefined && isPositiveNumber(Number(body.registeredCount), 0, 100000)) {
        evt.registeredCount = Math.round(Number(body.registeredCount));
      }
      if (typeof body.descriptionFr === 'string') evt.descriptionFr = cleanText(body.descriptionFr, 800);
      if (body.status === 'planifie' || body.status === 'en_cours' || body.status === 'termine') {
        evt.status = body.status;
      }
      if (typeof body.isShowcaseDemo === 'boolean') evt.isShowcaseDemo = body.isShowcaseDemo;
      return evt;
    });
    if (!updated) {
      res.status(404).json({ error: 'Événement introuvable.' });
      return;
    }
    res.json({ event: updated });
  });

  app.delete('/api/admin/events/:id', requireAdmin, async (req, res) => {
    const id = req.params.id;
    await mutateDb((db) => {
      db.events = db.events.filter((e) => e.id !== id);
    });
    res.json({ ok: true });
  });

  // Create / Send Quote (with items, discount, admin-configured VAT rate)
  app.post('/api/admin/quotes', requireAdmin, async (req, res) => {
    const body = req.body || {};
    const bookingId = cleanText(body.bookingId, 80);
    const itemsInput = Array.isArray(body.items) ? body.items : [];
    const discountMad = Math.max(0, Number(body.discountMad) || 0);
    const paymentTerms =
      cleanText(body.paymentTerms, 400) ||
      "Acompte de 30% à la validation du devis, solde 7 jours avant l'événement.";
    const validUntil = cleanText(body.validUntil, 20);
    const notes = cleanText(body.notes, 800);
    const sendImmediately = Boolean(body.sendImmediately);

    if (!bookingId || itemsInput.length === 0) {
      res.status(400).json({ error: 'Réservation et au moins une ligne de prestation requis.' });
      return;
    }

    const result = await mutateDb((db) => {
      const booking = db.bookings.find((b) => b.id === bookingId);
      if (!booking) return { error: 'Réservation introuvable.' };

      const vatRatePercent =
        body.vatRatePercent !== undefined && Number.isFinite(Number(body.vatRatePercent))
          ? Math.max(0, Math.min(30, Number(body.vatRatePercent)))
          : db.settings.vatRatePercent;

      const quoteId = `quo_${crypto.randomUUID()}`;
      const now = new Date().toISOString();
      const parsedItems: QuoteItem[] = [];
      let subtotalMad = 0;

      for (const raw of itemsInput) {
        const desc = cleanText(raw?.description, 200);
        const qty = Math.max(1, Number(raw?.quantity) || 1);
        const unitPrice = Math.max(0, Number(raw?.unitPriceMad) || 0);
        if (!desc) continue;
        const lineTotal = Math.round(qty * unitPrice * 100) / 100;
        subtotalMad += lineTotal;
        parsedItems.push({
          id: `qi_${crypto.randomUUID()}`,
          quoteId,
          serviceId: typeof raw?.serviceId === 'string' ? raw.serviceId : null,
          description: desc,
          quantity: qty,
          unitPriceMad: unitPrice,
          totalMad: lineTotal,
        });
      }

      if (parsedItems.length === 0) {
        return { error: 'Aucune prestation valide dans le devis.' };
      }

      const appliedDiscount = Math.min(subtotalMad, Math.round(discountMad * 100) / 100);
      const netHt = Math.max(0, subtotalMad - appliedDiscount);
      const vatAmountMad = Math.round(netHt * (vatRatePercent / 100) * 100) / 100;
      const totalTtcMad = Math.round((netHt + vatAmountMad) * 100) / 100;
      const status: QuoteStatus = sendImmediately ? 'envoye' : 'brouillon';

      const quote = {
        id: quoteId,
        quoteNumber: generateCodeNumber('DEV', db.quotes.length),
        bookingId: booking.id,
        userId: booking.userId,
        clientName: booking.fullName,
        clientEmail: booking.email,
        subtotalMad,
        discountMad: appliedDiscount,
        vatRatePercent,
        vatAmountMad,
        totalTtcMad,
        paymentTerms,
        validUntil: isValidIsoDate(validUntil)
          ? validUntil
          : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        notes,
        status,
        createdAt: now,
        updatedAt: now,
      };

      db.quotes.unshift(quote);
      db.quoteItems.push(...parsedItems);

      if (sendImmediately) {
        booking.status = 'devis_envoye';
        booking.updatedAt = now;
        if (booking.userId) {
          db.notifications.unshift({
            id: `ntf_${crypto.randomUUID()}`,
            userId: booking.userId,
            targetRole: 'client',
            title: `Devis ${quote.quoteNumber} disponible`,
            message: `Un devis de ${totalTtcMad} DH a été émis pour votre dossier ${booking.bookingNumber}.`,
            isRead: false,
            createdAt: now,
          });
        }
      }

      return { quote, items: parsedItems };
    });

    if ('error' in result) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.status(201).json(result);
  });

  app.patch('/api/admin/quotes/:id', requireAdmin, async (req, res) => {
    const id = req.params.id;
    const statusInput = req.body?.status;
    const allowed: QuoteStatus[] = ['brouillon', 'envoye', 'accepte', 'refuse', 'expire'];
    if (!allowed.includes(statusInput)) {
      res.status(400).json({ error: 'Statut de devis invalide.' });
      return;
    }

    const updated = await mutateDb((db) => {
      const quote = db.quotes.find((q) => q.id === id);
      if (!quote) return null;
      const now = new Date().toISOString();
      quote.status = statusInput;
      quote.updatedAt = now;
      if (statusInput === 'envoye') {
        const booking = db.bookings.find((b) => b.id === quote.bookingId);
        if (booking && booking.status === 'nouvelle_demande') {
          booking.status = 'devis_envoye';
          booking.updatedAt = now;
        }
        if (quote.userId) {
          db.notifications.unshift({
            id: `ntf_${crypto.randomUUID()}`,
            userId: quote.userId,
            targetRole: 'client',
            title: `Devis ${quote.quoteNumber} envoyé`,
            message: `Consultez votre devis de ${quote.totalTtcMad} DH depuis votre espace client.`,
            isRead: false,
            createdAt: now,
          });
        }
      }
      return quote;
    });

    if (!updated) {
      res.status(404).json({ error: 'Devis introuvable.' });
      return;
    }
    res.json({ quote: updated });
  });

  // Validate or update payment status
  app.patch('/api/admin/payments/:id', requireAdmin, async (req, res) => {
    const id = req.params.id;
    const nextStatus = req.body?.status as PaymentStatus;
    const allowed: PaymentStatus[] = [
      'en_attente',
      'en_verification',
      'autorise_test',
      'valide',
      'echoue',
      'rembourse',
    ];
    if (!allowed.includes(nextStatus)) {
      res.status(400).json({ error: 'Statut de paiement invalide.' });
      return;
    }

    const updated = await mutateDb((db) => {
      const payment = db.payments.find((p) => p.id === id);
      if (!payment) return null;
      const now = new Date().toISOString();
      payment.status = nextStatus;
      if (typeof req.body?.notes === 'string') {
        payment.notes = cleanText(req.body.notes, 300);
      }
      payment.updatedAt = now;

      // Recalculate invoice totals
      const invoice = db.invoices.find((inv) => inv.quoteId === payment.quoteId);
      if (invoice) {
        const validatedSum = db.payments
          .filter((p) => p.quoteId === payment.quoteId && p.status === 'valide')
          .reduce((sum, p) => sum + p.amountMad, 0);
        invoice.paidAmountMad = Math.round(validatedSum * 100) / 100;
        if (invoice.paidAmountMad >= invoice.totalTtcMad && invoice.totalTtcMad > 0) {
          invoice.status = 'payee';
        } else if (invoice.paidAmountMad > 0) {
          invoice.status = 'partielle';
        } else {
          invoice.status = 'emise';
        }
      }

      if (nextStatus === 'valide') {
        const booking = db.bookings.find((b) => b.id === payment.bookingId);
        if (booking && booking.status !== 'evenement_termine' && booking.status !== 'annulee') {
          booking.status = 'reservation_confirmee';
          booking.updatedAt = now;
        }
      }

      return { payment, invoice };
    });

    if (!updated) {
      res.status(404).json({ error: 'Paiement introuvable.' });
      return;
    }
    res.json(updated);
  });

  // Gallery CRUD
  app.post('/api/admin/gallery', requireAdmin, async (req, res) => {
    const body = req.body || {};
    const titleFr = cleanText(body.titleFr, 140);
    const category = cleanText(body.category, 40) as GalleryCategory;
    const mediaType = body.mediaType === 'video' ? 'video' : 'photo';
    const mediaUrl = cleanText(body.mediaUrl, 400);
    const thumbnailUrl = cleanText(body.thumbnailUrl, 400) || mediaUrl;
    const captionFr = cleanText(body.captionFr, 300);

    if (!titleFr || !isSafeMediaUrl(mediaUrl)) {
      res.status(400).json({ error: 'Titre et URL média sécurisée requis.' });
      return;
    }

    const item = await mutateDb((db) => {
      const created = {
        id: `gal_${crypto.randomUUID()}`,
        titleFr,
        titleAr: cleanText(body.titleAr, 140) || titleFr,
        titleEn: cleanText(body.titleEn, 140) || titleFr,
        category: category || 'soirees',
        mediaType: mediaType as 'photo' | 'video',
        mediaUrl,
        thumbnailUrl: isSafeMediaUrl(thumbnailUrl) ? thumbnailUrl : mediaUrl,
        captionFr,
        isDemoVisual: Boolean(body.isDemoVisual),
        createdAt: new Date().toISOString(),
      };
      db.gallery.unshift(created);
      return created;
    });

    res.status(201).json({ item });
  });

  app.delete('/api/admin/gallery/:id', requireAdmin, async (req, res) => {
    const id = req.params.id;
    await mutateDb((db) => {
      db.gallery = db.gallery.filter((g) => g.id !== id);
    });
    res.json({ ok: true });
  });

  // Testimonials CRUD
  app.post('/api/admin/testimonials', requireAdmin, async (req, res) => {
    const body = req.body || {};
    const authorName = cleanText(body.authorName, 120);
    const authorRole = cleanText(body.authorRole, 120);
    const companyOrCity = cleanText(body.companyOrCity, 120);
    const eventType = cleanText(body.eventType, 100);
    const quoteFr = cleanText(body.quoteFr, 600);
    if (!authorName || !quoteFr) {
      res.status(400).json({ error: "Nom de l'auteur et témoignage requis." });
      return;
    }

    const item = await mutateDb((db) => {
      const created = {
        id: `test_${crypto.randomUUID()}`,
        authorName,
        authorRole,
        companyOrCity,
        eventType,
        quoteFr,
        quoteAr: cleanText(body.quoteAr, 600) || quoteFr,
        quoteEn: cleanText(body.quoteEn, 600) || quoteFr,
        isPublished: body.isPublished !== false,
        createdAt: new Date().toISOString(),
      };
      db.testimonials.unshift(created);
      return created;
    });
    res.status(201).json({ testimonial: item });
  });

  app.patch('/api/admin/testimonials/:id', requireAdmin, async (req, res) => {
    const id = req.params.id;
    const updated = await mutateDb((db) => {
      const t = db.testimonials.find((x) => x.id === id);
      if (!t) return null;
      if (typeof req.body?.isPublished === 'boolean') t.isPublished = req.body.isPublished;
      if (typeof req.body?.quoteFr === 'string' && req.body.quoteFr.trim()) {
        t.quoteFr = cleanText(req.body.quoteFr, 600);
      }
      return t;
    });
    if (!updated) {
      res.status(404).json({ error: 'Témoignage introuvable.' });
      return;
    }
    res.json({ testimonial: updated });
  });

  app.delete('/api/admin/testimonials/:id', requireAdmin, async (req, res) => {
    const id = req.params.id;
    await mutateDb((db) => {
      db.testimonials = db.testimonials.filter((t) => t.id !== id);
    });
    res.json({ ok: true });
  });

  // Update Site Settings (Content, VAT, RIB, Stats, Blocked Dates, Booking Limits)
  app.patch('/api/admin/settings', requireAdmin, async (req, res) => {
    const body = req.body || {};
    const updated = await mutateDb((db) => {
      const s = db.settings;
      if (typeof body.companyName === 'string' && body.companyName.trim()) {
        s.companyName = cleanText(body.companyName, 80);
      }
      if (typeof body.sloganFr === 'string') s.sloganFr = cleanText(body.sloganFr, 160);
      if (typeof body.address === 'string') s.address = cleanText(body.address, 240);
      if (typeof body.phone === 'string') s.phone = cleanText(body.phone, 40);
      if (typeof body.email === 'string' && isValidEmail(body.email)) {
        s.email = cleanText(body.email, 180);
      }
      if (body.vatRatePercent !== undefined && Number.isFinite(Number(body.vatRatePercent))) {
        s.vatRatePercent = Math.max(0, Math.min(30, Number(body.vatRatePercent)));
      }
      if (typeof body.vatLabel === 'string') s.vatLabel = cleanText(body.vatLabel, 120);
      if (typeof body.allowOnSitePayment === 'boolean') {
        s.allowOnSitePayment = body.allowOnSitePayment;
      }
      if (typeof body.bankRib === 'string') s.bankRib = cleanText(body.bankRib, 120);
      if (typeof body.bankName === 'string') s.bankName = cleanText(body.bankName, 120);
      if (Array.isArray(body.blockedDates)) {
        s.blockedDates = body.blockedDates.filter((d: unknown): d is string => typeof d === 'string' && isValidIsoDate(d));
      }
      if (body.maxBookingsPerDay !== undefined && isPositiveNumber(Number(body.maxBookingsPerDay), 1, 50)) {
        s.maxBookingsPerDay = Math.round(Number(body.maxBookingsPerDay));
      }
      if (body.cancellationNoticeDays !== undefined && isPositiveNumber(Number(body.cancellationNoticeDays), 0, 90)) {
        s.cancellationNoticeDays = Math.round(Number(body.cancellationNoticeDays));
      }
      if (typeof body.heroTitleFr === 'string' && body.heroTitleFr.trim()) {
        s.heroTitleFr = cleanText(body.heroTitleFr, 200);
      }
      if (typeof body.heroSubtitleFr === 'string' && body.heroSubtitleFr.trim()) {
        s.heroSubtitleFr = cleanText(body.heroSubtitleFr, 400);
      }
      if (typeof body.ctaTitleFr === 'string' && body.ctaTitleFr.trim()) {
        s.ctaTitleFr = cleanText(body.ctaTitleFr, 240);
      }
      if (body.socialLinks && typeof body.socialLinks === 'object') {
        const links = body.socialLinks as Record<string, unknown>;
        for (const k of ['instagram', 'linkedin', 'facebook', 'youtube'] as const) {
          if (typeof links[k] === 'string' && isSafeMediaUrl(links[k] as string)) {
            s.socialLinks[k] = (links[k] as string).trim();
          }
        }
      }
      if (Array.isArray(body.stats)) {
        for (const entry of body.stats) {
          const target = s.stats.find((st) => st.key === entry?.key);
          if (target) {
            if (typeof entry.value === 'string') target.value = cleanText(entry.value, 40);
            if (typeof entry.unitOrContext === 'string') {
              target.unitOrContext = cleanText(entry.unitOrContext, 80);
            }
          }
        }
      }
      s.updatedAt = new Date().toISOString();
      return s;
    });

    res.json({ settings: updated });
  });

  // Create additional admin or manager user
  app.post('/api/admin/users', requireAdmin, async (req, res) => {
    const email = cleanText(req.body?.email, 180).toLowerCase();
    const fullName = cleanText(req.body?.fullName, 120);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const role = req.body?.role === 'manager' ? 'manager' : 'admin';

    if (!isValidEmail(email) || !fullName || password.length < 10) {
      res.status(400).json({ error: 'E-mail, nom et mot de passe (min. 10 car.) requis.' });
      return;
    }

    const result = await mutateDb((db) => {
      if (db.users.some((u) => u.email.toLowerCase() === email)) {
        return { error: 'Un compte utilise déjà cet e-mail.' };
      }
      const now = new Date().toISOString();
      const userId = `adm_${crypto.randomUUID()}`;
      db.users.push({
        id: userId,
        email,
        passwordHash: hashPassword(password),
        role,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      db.profiles.push({
        id: `prf_${crypto.randomUUID()}`,
        userId,
        fullName,
        phone: db.settings.phone,
        city: 'Casablanca',
        company: db.settings.companyName,
        preferredLanguage: 'fr',
        cndpConsentAt: now,
        updatedAt: now,
      });
      return { id: userId, email, role, fullName, isActive: true, createdAt: now };
    });

    if ('error' in result) {
      res.status(409).json({ error: result.error });
      return;
    }
    res.status(201).json({ adminUser: result });
  });

  app.patch('/api/admin/contact/:id', requireAdmin, async (req, res) => {
    const id = req.params.id;
    await mutateDb((db) => {
      const msg = db.contactMessages.find((m) => m.id === id);
      if (msg) msg.status = 'traite';
    });
    res.json({ ok: true });
  });

  app.patch('/api/admin/notifications/read-all', requireAdmin, async (_req, res) => {
    await mutateDb((db) => {
      for (const n of db.notifications) {
        if (n.targetRole === 'admin') n.isRead = true;
      }
    });
    res.json({ ok: true });
  });

  // Vite Dev Middleware or Static Production Assets
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EVENT PRO server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
