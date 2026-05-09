import { useEffect, useMemo, useState } from 'react'
import {
  fallbackAbout, fallbackPartenaires, fallbackServices,
  fallbackSlides, fallbackSpecialistes, fallbackTheme,
  fallbackTestimonials, fallbackFAQ,
} from './data/fallbackData'
import { publicApi, storageUrl } from './api/publicApi'

/* ─── helpers ──────────────────────────────────────────── */
function normalizeList(res, fb) {
  if (!res) return fb
  if (Array.isArray(res))       return res.length      ? res           : fb
  if (Array.isArray(res?.data)) return res.data.length ? res.data      : fb
  if (Array.isArray(res?.data?.data)) return res.data.data.length ? res.data.data : fb
  return fb
}
const initials = (n = '') => n.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

/* ─── nav links ─────────────────────────────────────────── */
const NAV = [
  { href: '#accueil',      label: 'Accueil' },
  { href: '#about',        label: 'À propos' },
  { href: '#services',     label: 'Services' },
  { href: '#specialistes', label: 'Spécialistes' },
  { href: '#partenaires',  label: 'Partenaires' },
  { href: '#contact',      label: 'Contact' },
]

/* ─── stats strip data ──────────────────────────────────── */
const KEY_STATS = [
  { icon: '🕐', value: '24/7',  label: 'Disponibilité patient' },
  { icon: '⚕️', value: '+30',   label: 'Services médicaux' },
  { icon: '👨‍⚕️', value: '+50',   label: 'Professionnels de santé' },
  { icon: '✅', value: '100%',  label: 'Suivi structuré numérique' },
]

/* ─── service icons SVG ─────────────────────────────────── */
const SVC_ICONS = [
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>,
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>,
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>,
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 10-16 0"/></svg>,
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/><path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/><path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/><path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/><path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z"/><path d="M15.5 9H17v1.5c0 .83-.67 1.5-1.5 1.5S14 11.33 14 10.5 14.67 9 15.5 9z"/><path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z"/><path d="M8.5 15H7v-1.5c0-.83.67-1.5 1.5-1.5S10 12.67 10 13.5 9.33 15 8.5 15z"/></svg>,
]

/* ─── arrow icons ───────────────────────────────────────── */
const Arrow = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
)
const IcoPrev = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
)
const IcoNext = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
)

/* ─── RDV Modal ─────────────────────────────────────────── */
function RdvModal({ open, onClose, specialistes, initialDoctor }) {
  const [step, setStep]     = useState('form')
  const [errMsg, setErrMsg] = useState('')
  const [ref, setRef]       = useState('')
  const [form, setForm]     = useState({
    consulting_doctor_id: '',
    appointment_date: '',
    nom_patient: '',
    telephone: '',
    email: '',
    remarks: '',
  })

  useEffect(() => {
    if (open) {
      setStep('form'); setErrMsg(''); setRef('')
      setForm(f => ({ ...f, consulting_doctor_id: String(initialDoctor?.id ?? '') }))
    }
  }, [open, initialDoctor?.id])

  if (!open) return null

  const ch = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  const today = new Date().toISOString().split('T')[0]

  const submit = async e => {
    e.preventDefault()
    setStep('sending'); setErrMsg('')
    try {
      const res = await publicApi.appointment(form)
      setRef(res.reference || '')
      setStep('success')
    } catch (e) {
      setErrMsg(e?.message || "Une erreur est survenue. Veuillez réessayer ou nous contacter directement.")
      setStep('error')
    }
  }

  return (
    <div className="rdv-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="rdv-modal">
        <div className="rdv-modal-header">
          <div>
            <h2>Demande de rendez-vous</h2>
            <p>Remplissez le formulaire, nous vous confirmons sous 24h</p>
          </div>
          <button className="rdv-modal-close" onClick={onClose} aria-label="Fermer">✕</button>
        </div>

        {step === 'success' ? (
          <div className="rdv-success">
            <div className="rdv-success-icon">✓</div>
            <h3>Demande enregistrée !</h3>
            <p>Notre équipe vous contactera pour confirmer votre créneau.</p>
            {ref && <div className="rdv-ref">Référence : <strong>{ref}</strong></div>}
            <button className="rdv-btn-primary" onClick={onClose}>Fermer</button>
          </div>
        ) : (
          <form className="rdv-form" onSubmit={submit}>
            {/* ── Section 1 ── */}
            <div className="rdv-section">
              <div className="rdv-section-title">
                <span className="rdv-section-icon">🗓️</span>
                <h3>Informations du rendez-vous</h3>
              </div>
              <div className="rdv-fields">
                <div className="rdv-field">
                  <label>Date souhaitée *</label>
                  <input type="date" name="appointment_date" value={form.appointment_date} onChange={ch} min={today} required />
                </div>
                <div className="rdv-field rdv-field-full">
                  <label>Motif de la consultation</label>
                  <textarea name="remarks" value={form.remarks} onChange={ch} placeholder="Décrivez brièvement le motif de votre consultation…" rows={3} />
                </div>
              </div>
            </div>

            {/* ── Section 2 ── */}
            <div className="rdv-section">
              <div className="rdv-section-title">
                <span className="rdv-section-icon">👤</span>
                <h3>Informations du patient</h3>
              </div>
              <div className="rdv-fields">
                <div className="rdv-field">
                  <label>Nom complet *</label>
                  <input type="text" name="nom_patient" value={form.nom_patient} onChange={ch} placeholder="Prénom Nom" required />
                </div>
                <div className="rdv-field">
                  <label>Téléphone *</label>
                  <input type="tel" name="telephone" value={form.telephone} onChange={ch} placeholder="+221 XX XXX XX XX" required />
                </div>
                <div className="rdv-field rdv-field-full">
                  <label>Email *</label>
                  <input type="email" name="email" value={form.email} onChange={ch} placeholder="votre@email.com" required />
                </div>
              </div>
            </div>

            {step === 'error' && <div className="rdv-error">{errMsg}</div>}

            <div className="rdv-actions">
              <button type="button" className="rdv-btn-ghost" onClick={onClose}>Annuler</button>
              <button type="submit" className="rdv-btn-primary" disabled={step === 'sending'}>
                {step === 'sending'
                  ? <><span className="spin-sm" /> Envoi en cours…</>
                  : <>Envoyer la demande <Arrow /></>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

/* ─── pagination bar ────────────────────────────────────── */
function PaginationBar({ page, total, onPrev, onNext, onDot }) {
  if (total <= 1) return null
  return (
    <div className="pg-bar">
      <button className="pg-btn" onClick={onPrev} disabled={page === 0}>
        <IcoPrev /> Précédent
      </button>
      <div className="pg-dots">
        {Array.from({ length: Math.min(total, 10) }, (_, i) => (
          <span key={i} className={`pg-dot${i === page ? ' active' : ''}`} onClick={() => onDot(i)} />
        ))}
      </div>
      <span className="pg-info">{page + 1} / {total}</span>
      <button className="pg-btn" onClick={onNext} disabled={page >= total - 1}>
        Suivant <IcoNext />
      </button>
    </div>
  )
}

/* ─── pin / phone / mail icons ──────────────────────────── */
const IcoPin  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s-8-5.8-8-12a8 8 0 0116 0c0 6.2-8 12-8 12z"/><circle cx="12" cy="10" r="3"/></svg>
const IcoPhone = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.29 6.29l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
const IcoMail = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/></svg>

/* ══════════════════════════════════════════════════════════
   HEADER
══════════════════════════════════════════════════════════ */
function Header({ theme, onRdv }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const go = (href) => {
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setOpen(false)
  }

  return (
    <header className={`site-header${scrolled ? ' scrolled' : ''}`}>
      {/* Brand */}
      <a className="brand" href="#accueil" onClick={e => { e.preventDefault(); go('#accueil') }}>
        {theme.logo_url
          ? <img className="brand-logo" src={storageUrl(theme.logo_url)} alt={theme.app_name} />
          : <span className="brand-mark">{(theme.app_name || 'S')[0]}</span>}
        <span>
          <span className="brand-name">{theme.app_name}</span>
          <span className="brand-tagline">{theme.app_slogan}</span>
        </span>
      </a>

      {/* Desktop nav */}
      <nav className={open ? 'main-nav open' : 'main-nav'}>
        {NAV.map(({ href, label }) => (
          <a key={href} href={href} onClick={e => { e.preventDefault(); go(href) }}>{label}</a>
        ))}
        <button className="nav-cta" onClick={() => { onRdv(); setOpen(false) }}>
          Prendre RDV
        </button>
      </nav>

      {/* Mobile toggle */}
      <button className="nav-toggle" onClick={() => setOpen(v => !v)} aria-label="Menu">
        <span /><span /><span />
      </button>
    </header>
  )
}

/* ══════════════════════════════════════════════════════════
   HERO
══════════════════════════════════════════════════════════ */
function Hero({ slides, theme, onRdv }) {
  const [idx, setIdx] = useState(0)
  const slide = slides[idx] || fallbackSlides[0]
  const bg    = slide.image || storageUrl(slide.image_url || slide.banner_url || '')

  useEffect(() => {
    if (slides.length <= 1) return
    const t = setInterval(() => setIdx(i => (i + 1) % slides.length), 5000)
    return () => clearInterval(t)
  }, [slides.length])

  return (
    <section id="accueil" className="hero">
      {/* Background */}
      <div className="hero-bg">
        {bg
          ? <img src={bg} alt="" />
          : <div className="hero-bg-gradient" />}
      </div>
      <div className="hero-overlay" />

      {/* Decorative circles */}
      <div className="hero-deco hero-deco-1" />
      <div className="hero-deco hero-deco-2" />

      {/* Decorative medical cross */}
      <svg className="hero-cross" style={{ top: 120, right: '10%', width: 180, height: 180 }} viewBox="0 0 80 80" fill="white">
        <rect x="30" y="0" width="20" height="80" rx="4"/>
        <rect x="0" y="30" width="80" height="20" rx="4"/>
      </svg>
      <svg className="hero-cross" style={{ bottom: 100, left: '5%', width: 100, height: 100 }} viewBox="0 0 80 80" fill="white">
        <rect x="30" y="0" width="20" height="80" rx="4"/>
        <rect x="0" y="30" width="80" height="20" rx="4"/>
      </svg>

      {/* Content */}
      <div className="hero-content">
        <div style={{ animation: 'fadeUp .7s ease' }}>
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-dot" />
            {theme.app_slogan || 'Votre santé, notre priorité'}
          </div>
          <h1>{slide.title}</h1>
          <p className="hero-subtitle">{slide.description}</p>
          <div className="hero-actions">
            <button className="btn btn-accent" onClick={() => onRdv()}>
              {slide.button_label || 'Prendre rendez-vous'} <Arrow />
            </button>
            <a className="btn btn-ghost-white" href="#services">Nos services</a>
          </div>
        </div>

        {/* Quick RDV card */}
        <div className="rdv-card" id="rendez-vous">
          <span className="rdv-label">Prise en charge rapide</span>
          <h3>Un parcours simple pour trouver le bon service</h3>
          <button className="rdv-link" onClick={() => onRdv()}>Prendre RDV <Arrow /></button>
        </div>
      </div>

      {/* Dots */}
      {slides.length > 1 && (
        <div className="hero-dots">
          {slides.map((_, i) => (
            <button key={i} className={i === idx ? 'active' : ''} onClick={() => setIdx(i)} />
          ))}
        </div>
      )}

      {/* Bottom info bar */}
      <div className="hero-bar">
        {theme.phone && <span>📞 {theme.phone}</span>}
        {theme.hours && <span>🕐 {theme.hours}</span>}
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════
   STATS STRIP
══════════════════════════════════════════════════════════ */
function StatsStrip() {
  return (
    <div className="stats-strip">
      <div className="container">
        <div className="stats-strip-inner">
          {KEY_STATS.map((s, i) => (
            <div className="stats-strip-item" key={i}>
              <div className="stats-strip-icon">{s.icon}</div>
              <div>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   ABOUT
══════════════════════════════════════════════════════════ */
function About({ about }) {
  const stats = about.stats || fallbackAbout.stats
  return (
    <section id="about" className="about-section animate-on-scroll">
      <div className="about-deco" />
      <div className="container">
        <div className="about-grid">
          {/* text */}
          <div>
            <span className="tag">Institution</span>
            <h2 className="h2">{about.title}</h2>
            <p className="about-body">{about.content}</p>
            <a className="about-cta" href="#contact">Nous contacter <Arrow /></a>
          </div>
          {/* stats */}
          <div className="about-stats">
            {stats.map((s, i) => (
              <div className="stat-box" key={s.label || i}>
                <span className="stat-val">{s.value}</span>
                <span className="stat-lbl">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════
   SERVICES  (paginated · 5 par page)
══════════════════════════════════════════════════════════ */
function Services({ services }) {
  const PER = 5
  const [page, setPage] = useState(0)
  useEffect(() => setPage(0), [services.length])

  const total   = Math.ceil(services.length / PER)
  const visible = services.slice(page * PER, page * PER + PER)

  return (
    <section id="services" className="services-section animate-on-scroll">
      <div className="services-deco-1" />
      <div className="services-deco-2" />
      <div className="container">
        <div className="section-header">
          <span className="tag">Expertise médicale</span>
          <h2 className="h2 center">Nos Services</h2>
          <p className="lead center" style={{ marginTop: 12 }}>
            Des services médicaux organisés pour accompagner chaque patient depuis l'accueil jusqu'au suivi.
          </p>
        </div>

        {/* animated row — key forces re-mount → CSS fade-in on page change */}
        <div key={`svc-${page}`} className="svc-row">
          {visible.map((s, i) => {
            const absIdx = page * PER + i
            return (
              <article className="svc-card" key={s.id || absIdx}>
                <div className="svc-top">
                  <span className="svc-num">{String(absIdx + 1).padStart(2, '0')}</span>
                  <div className="svc-icon-wrap">
                    {SVC_ICONS[absIdx % SVC_ICONS.length]}
                  </div>
                </div>
                <h3>{s.nom || s.name || s.libelle}</h3>
                <p>{s.description || s.description_courte || 'Prise en charge médicale disponible.'}</p>
                <a className="svc-link" href="#contact">En savoir plus <Arrow /></a>
              </article>
            )
          })}
        </div>

        <PaginationBar
          page={page} total={total}
          onPrev={() => setPage(p => p - 1)}
          onNext={() => setPage(p => p + 1)}
          onDot={setPage}
        />
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════
   SPECIALISTS  (paginated · 5 par page)
══════════════════════════════════════════════════════════ */
function Specialistes({ specialistes, onRdv }) {
  const PER = 5
  const [page, setPage] = useState(0)
  useEffect(() => setPage(0), [specialistes.length])

  const total   = Math.ceil(specialistes.length / PER)
  const visible = specialistes.slice(page * PER, page * PER + PER)

  return (
    <section id="specialistes" className="specialists-section animate-on-scroll">
      <div className="container">
        <div className="section-header">
          <span className="tag">Équipe soignante</span>
          <h2 className="h2 center">Nos Spécialistes</h2>
          <p className="lead center" style={{ marginTop: 12 }}>
            Des professionnels de santé qualifiés et dévoués à votre bien-être au quotidien.
          </p>
        </div>

        <div key={`doc-${page}`} className="doc-row">
          {visible.map((doc, i) => {
            const nom      = doc.nom       || doc.staff_name || doc.name || 'Médecin'
            const spec     = doc.specialite || doc.speciality || 'Spécialiste'
            const photo    = doc.photo ? storageUrl(doc.photo) : null
            return (
              <article className="doc-card" key={doc.id || i}>
                {/* Avatar */}
                <div className="doc-avatar">
                  {photo
                    ? <img src={photo} alt={nom} onError={e => { e.target.style.display = 'none' }} />
                    : <span className="doc-initials">{initials(nom)}</span>}
                </div>
                {/* Info */}
                <h3>Dr. {nom}</h3>
                <span className="doc-spec">{spec}</span>
                <button className="doc-rdv" onClick={() => onRdv({ id: doc.id, nom })}>
                  Prendre RDV <Arrow />
                </button>
              </article>
            )
          })}
        </div>

        <PaginationBar
          page={page} total={total}
          onPrev={() => setPage(p => p - 1)}
          onNext={() => setPage(p => p + 1)}
          onDot={setPage}
        />
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════
   TESTIMONIALS
══════════════════════════════════════════════════════════ */
function Testimonials({ testimonials }) {
  if (!testimonials?.length) return null
  return (
    <section id="temoignages" className="testimonials-section animate-on-scroll">
      <div className="container">
        <div className="section-header">
          <span className="tag">Ils nous font confiance</span>
          <h2 className="h2 center">Avis Patients</h2>
          <p className="lead center" style={{ marginTop: 12 }}>
            Découvrez les témoignages de nos patients satisfaits.
          </p>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((t, i) => {
            const photo = t.photo ? storageUrl(t.photo) : null
            return (
              <article className="testi-card" key={t.id || i}>
                <div className="testi-stars">{'★'.repeat(t.note || 5)}{'☆'.repeat(5 - (t.note || 5))}</div>
                <p className="testi-text">{t.texte}</p>
                <div className="testi-author">
                  {photo
                    ? <img src={photo} alt={t.nom} />
                    : <div className="testi-avatar">{initials(t.nom)}</div>}
                  <div>
                    <div className="testi-name">{t.nom}</div>
                    <div className="testi-role">{t.role || 'Patient'}</div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════
   PARTNERS
══════════════════════════════════════════════════════════ */
function Partenaires({ partenaires }) {
  return (
    <section id="partenaires" className="partners-section animate-on-scroll">
      <div className="container">
        <div className="section-header">
          <span className="tag">Réseau de confiance</span>
          <h2 className="h2 center">Nos Partenaires</h2>
          <p className="lead center" style={{ marginTop: 12 }}>
            Un réseau d'établissements et d'assurances partenaires pour faciliter votre accès aux soins.
          </p>
        </div>
        <div className="partners-grid">
          {partenaires.map((p, i) => {
            const nom  = p.nom || p.Nom || 'Partenaire'
            const logo = p.logo ? storageUrl(p.logo) : null
            return (
              <a
                className="partner-card"
                key={p.id || i}
                href={p.lien || '#contact'}
                onClick={!p.lien ? e => e.preventDefault() : undefined}
              >
                {logo
                  ? <div className="partner-logo-box"><img src={logo} alt={nom} /></div>
                  : <div className="partner-initials">{initials(nom)}</div>}

                <h3>{nom}</h3>
                <div className="partner-divider" />

                <div className="partner-meta">
                  {(p.adress || p.address) && (
                    <div className="partner-meta-row"><IcoPin /><span>{p.adress || p.address}</span></div>
                  )}
                  {(p.mobile || p.contact) && (
                    <div className="partner-meta-row"><IcoPhone /><span>{p.mobile || p.contact}</span></div>
                  )}
                  {p.email && (
                    <div className="partner-meta-row"><IcoMail /><span>{p.email}</span></div>
                  )}
                  {!p.adress && !p.address && !p.mobile && !p.contact && !p.email && (
                    <div className="partner-meta-row" style={{ fontStyle: 'italic', fontSize: 13 }}>
                      <span>Partenaire de santé</span>
                    </div>
                  )}
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════
   MAP
══════════════════════════════════════════════════════════ */
function MapSection({ theme }) {
  if (!theme.map_url) return null
  return (
    <div className="map-section">
      <div className="container">
        <div style={{ textAlign: 'center' }}>
          <span className="tag">Localisation</span>
          <h2 className="h2 center" style={{ fontSize: 30 }}>Retrouvez-nous</h2>
        </div>
        <div className="map-embed">
          <iframe src={theme.map_url} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Carte" />
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   FAQ
══════════════════════════════════════════════════════════ */
function FAQ({ faq }) {
  if (!faq?.length) return null
  return (
    <section id="faq" className="faq-section animate-on-scroll">
      <div className="container">
        <div className="section-header">
          <span className="tag">Questions fréquentes</span>
          <h2 className="h2 center">FAQ</h2>
          <p className="lead center" style={{ marginTop: 12 }}>Réponses aux questions les plus posées par nos patients.</p>
        </div>
        <div className="faq-list">
          {faq.map((item, i) => (
            <details className="faq-item" key={item.id || i}>
              <summary>{item.question}<span className="faq-toggle">+</span></summary>
              <p>{item.reponse}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════
   CONTACT
══════════════════════════════════════════════════════════ */
function Contact({ theme }) {
  const [form, setForm]   = useState({ nom: '', telephone: '', email: '', message: '' })
  const [status, setStatus] = useState('idle')
  const [err, setErr]     = useState('')

  const ch = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setStatus('sending'); setErr('')
    try {
      await publicApi.contact(form)
      setStatus('success')
      setForm({ nom: '', telephone: '', email: '', message: '' })
    } catch {
      setStatus('error'); setErr('Une erreur est survenue. Veuillez réessayer.')
    }
  }

  const DETAILS = [
    { icon: '📞', lbl: 'Téléphone', val: theme.phone },
    { icon: '✉️', lbl: 'Email',     val: theme.email },
    { icon: '📍', lbl: 'Adresse',   val: theme.address },
    { icon: '🕐', lbl: 'Horaires',  val: theme.hours },
  ].filter(d => d.val)

  return (
    <section id="contact" className="contact-section">
      <div className="contact-deco-1" /><div className="contact-deco-2" />
      <div className="container">
        <div className="contact-grid">
          {/* ── info ── */}
          <div>
            <span className="tag accent">Contactez-nous</span>
            <h2 className="h2 light">Nous sommes là pour vous</h2>
            <p className="contact-subtitle">
              Prenez contact avec notre équipe pour toute question ou pour planifier votre consultation.
            </p>
            <div className="contact-details">
              {DETAILS.map(d => (
                <div className="contact-item" key={d.lbl}>
                  <div className="contact-icon">{d.icon}</div>
                  <div>
                    <span className="contact-lbl">{d.lbl}</span>
                    <span className="contact-val">{d.val}</span>
                  </div>
                </div>
              ))}
            </div>
            {theme.map_url && (
              <a className="contact-map-btn" href={theme.map_url} target="_blank" rel="noopener noreferrer">
                📍 Voir sur la carte <Arrow />
              </a>
            )}
          </div>

          {/* ── form ── */}
          <div className="form-panel">
            {status === 'success' ? (
              <div className="form-success">
                <div className="success-icon">✓</div>
                <h4>Message envoyé !</h4>
                <p>Notre équipe vous contactera dans les plus brefs délais.</p>
                <button className="btn-reset" onClick={() => setStatus('idle')}>
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={submit}>
                <h3>Envoyez-nous un message</h3>
                <div className="form-row-2">
                  <div className="form-field">
                    <label>Nom complet *</label>
                    <input className="f-input" name="nom" value={form.nom} onChange={ch} placeholder="Votre nom" required />
                  </div>
                  <div className="form-field">
                    <label>Téléphone</label>
                    <input className="f-input" name="telephone" value={form.telephone} onChange={ch} placeholder="+221 XX XXX XX XX" />
                  </div>
                </div>
                <div className="form-field">
                  <label>Email</label>
                  <input className="f-input" name="email" type="email" value={form.email} onChange={ch} placeholder="votre@email.com" />
                </div>
                <div className="form-field">
                  <label>Message *</label>
                  <textarea className="f-textarea" name="message" value={form.message} onChange={ch} placeholder="Décrivez votre demande…" required rows={5} />
                </div>
                {status === 'error' && <div className="f-error">{err}</div>}
                <button type="submit" className="f-submit" disabled={status === 'sending'}>
                  {status === 'sending'
                    ? <><span className="spin-sm" />Envoi en cours…</>
                    : <>Envoyer le message <Arrow /></>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════
   FOOTER
══════════════════════════════════════════════════════════ */
function Footer({ theme }) {
  const yr = new Date().getFullYear()
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <strong>{theme.app_name}</strong>
            <p>{theme.app_slogan}. Une plateforme médicale au service de vos structures de santé.</p>
            {(theme.social_facebook || theme.social_instagram || theme.social_linkedin) && (
              <div className="footer-social">
                {theme.social_facebook  && <a href={theme.social_facebook}  target="_blank" rel="noopener noreferrer">FB</a>}
                {theme.social_instagram && <a href={theme.social_instagram} target="_blank" rel="noopener noreferrer">IG</a>}
                {theme.social_linkedin  && <a href={theme.social_linkedin}  target="_blank" rel="noopener noreferrer">LN</a>}
              </div>
            )}
          </div>
          <div className="footer-col">
            <h4>Navigation</h4>
            {NAV.map(l => <a key={l.href} href={l.href}>{l.label}</a>)}
          </div>
          <div className="footer-col">
            <h4>Nos services</h4>
            <a href="#services">Consultation générale</a>
            <a href="#services">Imagerie médicale</a>
            <a href="#services">Laboratoire</a>
            <a href="#specialistes">Spécialistes</a>
            <a href="#partenaires">Partenaires</a>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <address>
              {theme.phone   && <span>📞 {theme.phone}</span>}
              {theme.email   && <span>✉️ {theme.email}</span>}
              {theme.address && <span>📍 {theme.address}</span>}
              {theme.hours   && <span>🕐 {theme.hours}</span>}
            </address>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {yr} {theme.app_name} — Tous droits réservés</span>
          <span>Développé par DST Computing</span>
        </div>
      </div>
    </footer>
  )
}

/* ══════════════════════════════════════════════════════════
   WHATSAPP
══════════════════════════════════════════════════════════ */
function WhatsApp({ phone }) {
  if (!phone) return null
  return (
    <a className="whatsapp-btn" href={`https://wa.me/${phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="#fff">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </a>
  )
}

/* ══════════════════════════════════════════════════════════
   SKELETON
══════════════════════════════════════════════════════════ */
function Skeleton() {
  return (
    <div className="skeleton-section">
      <div className="container">
        <div className="skeleton-grid">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   APP ROOT
══════════════════════════════════════════════════════════ */
export default function App() {
  const [theme,        setTheme]        = useState(fallbackTheme)
  const [slides,       setSlides]       = useState(fallbackSlides)
  const [about,        setAbout]        = useState(fallbackAbout)
  const [services,     setServices]     = useState(fallbackServices)
  const [specialistes, setSpecialistes] = useState(fallbackSpecialistes)
  const [partenaires,  setPartenaires]  = useState(fallbackPartenaires)
  const [testimonials, setTestimonials] = useState(fallbackTestimonials)
  const [faq,          setFaq]          = useState(fallbackFAQ)
  const [loading,      setLoading]      = useState(true)
  const [rdvOpen,      setRdvOpen]      = useState(false)
  const [rdvDoctor,    setRdvDoctor]    = useState(null)
  const openRdv = (doc = null) => { setRdvDoctor(doc); setRdvOpen(true) }

  /* fetch all public data */
  useEffect(() => {
    Promise.allSettled([
      publicApi.preferences(),
      publicApi.slides(),
      publicApi.about(),
      publicApi.services(),
      publicApi.specialistes(),
      publicApi.partenaires(),
    ]).then(([p, s, a, sv, sp, par]) => {
      if (p.status   === 'fulfilled') setTheme({ ...fallbackTheme,     ...(p.value?.data   || p.value) })
      if (s.status   === 'fulfilled') setSlides(normalizeList(s.value,  fallbackSlides))
      if (a.status   === 'fulfilled') setAbout({ ...fallbackAbout,      ...(a.value?.data   || a.value) })
      if (sv.status  === 'fulfilled') setServices(normalizeList(sv.value,  fallbackServices))
      if (sp.status  === 'fulfilled') setSpecialistes(normalizeList(sp.value,  fallbackSpecialistes))
      if (par.status === 'fulfilled') setPartenaires(normalizeList(par.value,  fallbackPartenaires))
    }).finally(() => setLoading(false))
  }, [])

  /* scroll-in animations */
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.07 }
    )
    const t = setTimeout(() => {
      document.querySelectorAll('.animate-on-scroll').forEach(el => obs.observe(el))
    }, 120)
    return () => { clearTimeout(t); obs.disconnect() }
  }, [loading])

  /* apply preferences (colors, logo…) from admin config as CSS variables */
  const cssVars = useMemo(() => ({
    '--primary':       theme.primary_color || fallbackTheme.primary_color,
    '--accent':        theme.accent_color  || fallbackTheme.accent_color,
    '--primary-dark':  theme.primary_color ? `color-mix(in srgb, ${theme.primary_color} 72%, black)` : '#001f42',
    '--primary-light': theme.primary_color ? `color-mix(in srgb, ${theme.primary_color} 72%, white)` : '#0050a0',
    '--accent-dark':   theme.accent_color  ? `color-mix(in srgb, ${theme.accent_color}  82%, black)` : '#e05e1a',
    '--accent-light':  theme.accent_color  ? `color-mix(in srgb, ${theme.accent_color}  70%, white)` : '#ff9a6b',
  }), [theme])

  return (
    <div style={cssVars}>
      <Header theme={theme} onRdv={openRdv} />
      <main>
        <Hero slides={slides.length ? slides : fallbackSlides} theme={theme} onRdv={openRdv} />
        <StatsStrip />
        {loading ? (
          <><Skeleton /><Skeleton /><Skeleton /></>
        ) : (
          <>
            <About         about={about} />
            <Services      services={services} />
            <Specialistes  specialistes={specialistes} onRdv={openRdv} />
            <Testimonials  testimonials={testimonials} />
            <Partenaires   partenaires={partenaires} />
            <MapSection    theme={theme} />
            <FAQ           faq={faq} />
            <Contact       theme={theme} />
          </>
        )}
      </main>
      <Footer theme={theme} />
      <WhatsApp phone={theme.phone} />
      <RdvModal
        open={rdvOpen}
        onClose={() => setRdvOpen(false)}
        specialistes={specialistes}
        initialDoctor={rdvDoctor}
      />
    </div>
  )
}
