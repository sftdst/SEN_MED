import { useState, useEffect, useCallback } from 'react'
import { colors, radius, shadows, typography } from '../../theme'
import { webAdminApi, preferencesApi } from '../../api'
import Spinner from '../../components/ui/Spinner'

/* ─── Shared UI primitives ─────────────────────────────────────────────────── */

function SectionCard({ title, children, action }) {
  return (
    <div style={{
      background: colors.white,
      border: `1px solid ${colors.gray200}`,
      borderRadius: radius.md,
      boxShadow: shadows.sm,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '12px 18px',
        borderBottom: `1px solid ${colors.gray200}`,
        background: colors.gray50,
        fontSize: 13,
        fontWeight: 800,
        color: colors.gray900,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span>{title}</span>
        {action}
      </div>
      <div style={{ padding: 18 }}>{children}</div>
    </div>
  )
}

function InputField({ label, value, onChange, type = 'text', placeholder, rows, hint }) {
  const inputStyle = {
    width: '100%',
    border: `1.5px solid ${colors.gray300}`,
    borderRadius: radius.sm,
    background: colors.white,
    color: colors.gray900,
    padding: '9px 12px',
    fontSize: 13,
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  }
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: colors.gray700 }}>{label}</span>
      {rows ? (
        <textarea value={value} onChange={onChange} placeholder={placeholder}
          rows={rows} style={{ ...inputStyle, resize: 'vertical' }} />
      ) : (
        <input type={type} value={value} onChange={onChange}
          placeholder={placeholder} style={inputStyle} />
      )}
      {hint && <span style={{ fontSize: 11, color: colors.gray500 }}>{hint}</span>}
    </label>
  )
}

function Alert({ type, text, onClose }) {
  if (!text) return null
  const bg = type === 'success' ? '#ecfdf5' : '#fef2f2'
  const clr = type === 'success' ? '#065f46' : '#991b1b'
  const border = type === 'success' ? '#a7f3d0' : '#fecaca'
  return (
    <div style={{
      padding: '10px 14px', borderRadius: radius.sm,
      background: bg, color: clr, fontSize: 13,
      border: `1px solid ${border}`, marginBottom: 14,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <span>{text}</span>
      {onClose && (
        <button onClick={onClose} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: clr, fontSize: 16, lineHeight: 1, padding: '0 4px',
        }}>×</button>
      )}
    </div>
  )
}

function Btn({ onClick, disabled, variant = 'primary', size = 'md', children, title }) {
  const base = {
    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: radius.sm, fontFamily: 'inherit',
    fontWeight: 600, transition: 'opacity 0.15s',
    opacity: disabled ? 0.6 : 1, display: 'inline-flex',
    alignItems: 'center', gap: 6,
  }
  const sizes = { sm: { padding: '5px 12px', fontSize: 12 }, md: { padding: '8px 18px', fontSize: 13 } }
  const variants = {
    primary:  { background: colors.bleu,    color: '#fff' },
    danger:   { background: '#ef4444',      color: '#fff' },
    ghost:    { background: colors.gray100, color: colors.gray700 },
    warning:  { background: '#f59e0b',      color: '#fff' },
    success:  { background: '#10b981',      color: '#fff' },
  }
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      style={{ ...base, ...sizes[size], ...variants[variant] }}>
      {children}
    </button>
  )
}

function Badge({ active }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 100,
      fontSize: 11, fontWeight: 700,
      background: active ? '#dcfce7' : colors.gray100,
      color: active ? '#166534' : colors.gray500,
    }}>
      {active ? 'Actif' : 'Inactif'}
    </span>
  )
}

/* svg micro-icons */
const IcoEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const IcoTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)
const IcoPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IcoImg = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: colors.gray400 }}>
    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
)
const IcoMail = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)

/* ─── Champs système requis par AppPreferenceController::save() ─────────────
   Ces champs ne sont pas affichés ici mais sont obligatoires à l'enregistrement.
   On les charge depuis l'API et on les renvoie intacts lors du save.           */
const SYSTEM_FIELD_DEFAULTS = {
  app_initial:     'SM',
  theme_mode:      'light',
  density:         'normal',
  sidebar_default: 'expanded',
  language:        'fr',
  currency:        'FCFA',
  date_format:     'DD/MM/YYYY',
  default_page:    '/',
}

/* ─── Tab 1: Accueil (ex Charte graphique) ────────────────────────────────── */

export function PageWebConfigForm() { return <AccueilTab /> }

function AccueilTab() {
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [systemFields, setSystem] = useState(SYSTEM_FIELD_DEFAULTS)
  const [form, setForm]           = useState({
    app_name: 'SenMed', app_slogan: '', logo_url: '',
    phone: '', email: '', address: '', hours: '',
    primary_color: '#003268', accent_color: '#ff7631',
  })
  const [alert, setAlert] = useState(null)

  useEffect(() => {
    preferencesApi.get()
      .then((res) => {
        // La réponse est enveloppée : { data: prefObj }
        const prefs = res.data?.data ?? res.data ?? {}
        // Conserver les champs système pour les renvoyer au save
        setSystem({
          app_initial:     prefs.app_initial     ?? 'SM',
          theme_mode:      prefs.theme_mode      ?? 'light',
          density:         prefs.density         ?? 'normal',
          sidebar_default: prefs.sidebar_default ?? 'expanded',
          language:        prefs.language        ?? 'fr',
          currency:        prefs.currency        ?? 'FCFA',
          date_format:     prefs.date_format      ?? 'DD/MM/YYYY',
          default_page:    prefs.default_page    ?? '/',
        })
        setForm({
          app_name:      prefs.app_name      ?? 'SenMed',
          app_slogan:    prefs.app_slogan    ?? '',
          logo_url:      prefs.logo_url      ?? '',
          phone:         prefs.phone         ?? '',
          email:         prefs.email         ?? '',
          address:       prefs.address       ?? '',
          hours:         prefs.hours         ?? '',
          primary_color: prefs.primary_color ?? '#003268',
          accent_color:  prefs.accent_color  ?? '#ff7631',
        })
      })
      .catch(() => setAlert({ type: 'error', text: 'Erreur de chargement des préférences' }))
      .finally(() => setLoading(false))
  }, [])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setAlert(null)
    try {
      // Inclure les champs système requis + les champs web affichés
      await preferencesApi.save({ ...systemFields, ...form })
      setAlert({ type: 'success', text: 'Préférences enregistrées. Rechargez la page web pour voir les changements.' })
    } catch (err) {
      const errors = err?.response?.data?.errors
      const msg = errors
        ? Object.values(errors).flat().join(' — ')
        : err?.response?.data?.message ?? "Erreur lors de l'enregistrement"
      setAlert({ type: 'error', text: msg })
    } finally { setSaving(false) }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>

  return (
    <form onSubmit={handleSubmit}>
      <Alert type={alert?.type} text={alert?.text} onClose={() => setAlert(null)} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>

        <SectionCard title="Identité du site">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <InputField label="Nom de l'application" value={form.app_name} onChange={set('app_name')} placeholder="SenMed" />
            <InputField label="Slogan" value={form.app_slogan} onChange={set('app_slogan')} placeholder="Votre santé, notre priorité" />
            <InputField
              label="URL du logo"
              value={form.logo_url}
              onChange={set('logo_url')}
              placeholder="https://…/logo.png"
              hint="Lien vers l'image du logo affiché sur la page web"
            />
            {form.logo_url && /^https?:\/\//i.test(form.logo_url) && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: radius.sm,
                border: `1px solid ${colors.gray200}`, background: colors.gray50,
              }}>
                <img src={form.logo_url} alt="logo"
                  style={{ height: 36, maxWidth: 120, objectFit: 'contain' }}
                  onError={e => { e.target.style.display = 'none' }} />
                <span style={{ fontSize: 11, color: colors.gray500 }}>Aperçu du logo</span>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <InputField label="Couleur principale" type="color" value={form.primary_color} onChange={set('primary_color')} />
              <InputField label="Couleur accent" type="color" value={form.accent_color} onChange={set('accent_color')} />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: form.primary_color, border: `2px solid ${colors.gray200}` }} />
              <div style={{ width: 32, height: 32, borderRadius: 8, background: form.accent_color, border: `2px solid ${colors.gray200}` }} />
              <span style={{ fontSize: 11, color: colors.gray500 }}>Aperçu des couleurs — visible sur la page web après rechargement</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Coordonnées affichées sur le site">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <InputField label="Téléphone" value={form.phone} onChange={set('phone')} placeholder="+221 33 000 00 00" />
            <InputField label="Email de contact" type="email" value={form.email} onChange={set('email')} placeholder="contact@senmed.sn" />
            <InputField label="Adresse" value={form.address} onChange={set('address')} placeholder="Dakar, Sénégal" />
            <InputField label="Horaires d'ouverture" value={form.hours} onChange={set('hours')} placeholder="Lun - Sam : 08h00 - 18h00" />
          </div>
        </SectionCard>

      </div>
      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
        <Btn type="submit" disabled={saving}>
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </Btn>
      </div>
    </form>
  )
}

/* ─── Slide modal ─────────────────────────────────────────────────────────── */

const EMPTY_SLIDE = {
  title: '', description: '', image_url: '',
  button_label: 'En savoir plus', button_link: '#', sort_order: 0, is_active: true,
}

function SlideModal({ slide, onClose, onSaved }) {
  const isEdit = Boolean(slide?.id)
  const [form, setForm] = useState(isEdit ? { ...slide } : { ...EMPTY_SLIDE })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const setCheck = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.checked }))

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Le titre est requis'); return }
    setSaving(true)
    setError(null)
    try {
      if (isEdit) {
        await webAdminApi.updateSlide(form.id, form)
      } else {
        await webAdminApi.createSlide(form)
      }
      onSaved()
    } catch {
      setError("Erreur lors de l'enregistrement")
    } finally { setSaving(false) }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: colors.white, borderRadius: radius.lg, width: 540,
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${colors.gray200}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: colors.gray900 }}>
            {isEdit ? 'Modifier la slide' : 'Nouvelle slide'}
          </h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: colors.gray500, fontSize: 22, lineHeight: 1, padding: '0 4px',
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Alert type="error" text={error} onClose={() => setError(null)} />

          <InputField label="Titre *" value={form.title} onChange={set('title')} placeholder="Des soins modernes, accessibles" />
          <InputField label="Description" value={form.description || ''} onChange={set('description')}
            placeholder="Courte accroche affichée sous le titre…" rows={3} />
          <InputField label="URL de l'image" value={form.image_url || ''} onChange={set('image_url')}
            placeholder="https://…/image.jpg" hint="Lien direct vers l'image héro (format paysage recommandé)" />

          {form.image_url && /^https?:\/\//i.test(form.image_url) && (
            <div style={{
              borderRadius: radius.sm, overflow: 'hidden', border: `1px solid ${colors.gray200}`,
              aspectRatio: '16/5', background: colors.gray100,
            }}>
              <img src={form.image_url} alt="aperçu"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => { e.target.style.display = 'none' }} />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <InputField label="Libellé du bouton" value={form.button_label || ''} onChange={set('button_label')} placeholder="En savoir plus" />
            <InputField label="Lien du bouton" value={form.button_link || ''} onChange={set('button_link')} placeholder="#rendez-vous" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
            <InputField label="Ordre d'affichage" type="number" value={form.sort_order ?? 0} onChange={set('sort_order')} placeholder="0" />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 24 }}>
              <input type="checkbox" checked={!!form.is_active} onChange={setCheck('is_active')}
                style={{ width: 16, height: 16, accentColor: colors.bleu }} />
              <span style={{ fontSize: 13, color: colors.gray700 }}>Slide active (visible sur le site)</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px', borderTop: `1px solid ${colors.gray200}`,
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <Btn variant="ghost" onClick={onClose}>Annuler</Btn>
          <Btn onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer la slide'}
          </Btn>
        </div>
      </div>
    </div>
  )
}

/* ─── Tab 2: Diaporama ─────────────────────────────────────────────────────── */

function SlidesPage() {
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [alert, setAlert] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await webAdminApi.slides()
      setSlides(Array.isArray(data) ? data : [])
    } catch {
      setAlert({ type: 'error', text: 'Erreur de chargement des slides' })
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleToggle = async (id) => {
    try {
      await webAdminApi.toggleSlide(id)
      load()
    } catch {
      setAlert({ type: 'error', text: 'Erreur lors du changement de statut' })
    }
  }

  const handleDelete = async (slide) => {
    if (!window.confirm(`Supprimer la slide "${slide.title}" ?`)) return
    try {
      await webAdminApi.deleteSlide(slide.id)
      load()
    } catch {
      setAlert({ type: 'error', text: 'Erreur lors de la suppression' })
    }
  }

  return (
    <div>
      <Alert type={alert?.type} text={alert?.text} onClose={() => setAlert(null)} />

      <SectionCard
        title={`Slides du diaporama (${slides.length})`}
        action={<Btn size="sm" onClick={() => setModal('new')}><IcoPlus /> Nouvelle slide</Btn>}
      >
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner /></div>
        ) : slides.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '40px 20px', color: colors.gray400,
            fontSize: 14, border: `2px dashed ${colors.gray200}`, borderRadius: radius.sm,
          }}>
            Aucune slide. Cliquez sur "+ Nouvelle slide" pour commencer.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {slides.map(slide => (
              <div key={slide.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 14px', borderRadius: radius.sm,
                border: `1px solid ${colors.gray200}`, background: colors.white,
                transition: 'box-shadow 0.15s',
              }}>
                {/* Thumbnail */}
                <div style={{
                  width: 80, height: 50, flexShrink: 0, borderRadius: 6,
                  background: colors.gray100, overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${colors.gray200}`,
                }}>
                  {slide.image_url ? (
                    <img src={slide.image_url} alt={slide.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      onError={e => { e.target.style.display = 'none' }} />
                  ) : <IcoImg />}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: colors.gray900, marginBottom: 3 }}>
                    {slide.title}
                  </div>
                  {slide.description && (
                    <div style={{
                      fontSize: 12, color: colors.gray500, overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {slide.description}
                    </div>
                  )}
                </div>

                {/* Ordre */}
                <span style={{ fontSize: 11, color: colors.gray400, flexShrink: 0 }}>#{slide.sort_order}</span>

                {/* Status */}
                <Badge active={slide.is_active} />

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <Btn size="sm" variant={slide.is_active ? 'ghost' : 'success'}
                    onClick={() => handleToggle(slide.id)}
                    title={slide.is_active ? 'Désactiver' : 'Activer'}>
                    {slide.is_active ? 'Désact.' : 'Activer'}
                  </Btn>
                  <Btn size="sm" variant="ghost" onClick={() => setModal(slide)} title="Modifier"><IcoEdit /></Btn>
                  <Btn size="sm" variant="danger" onClick={() => handleDelete(slide)} title="Supprimer"><IcoTrash /></Btn>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {modal && (
        <SlideModal
          slide={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); setAlert({ type: 'success', text: 'Slide enregistrée.' }) }}
        />
      )}
    </div>
  )
}

/* ─── Tab 3: À propos ──────────────────────────────────────────────────────── */

function AboutPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', content: '',
    stat_1_value: '', stat_1_label: '',
    stat_2_value: '', stat_2_label: '',
    stat_3_value: '', stat_3_label: '',
    is_active: true,
  })
  const [alert, setAlert] = useState(null)

  useEffect(() => {
    webAdminApi.about()
      .then(({ data }) => setForm({ ...form, ...data }))
      .catch(() => setAlert({ type: 'error', text: 'Erreur de chargement' }))
      .finally(() => setLoading(false))
  }, [])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setAlert(null)
    try {
      await webAdminApi.saveAbout(form)
      setAlert({ type: 'success', text: 'Section « À propos » enregistrée.' })
    } catch {
      setAlert({ type: 'error', text: "Erreur lors de l'enregistrement" })
    } finally { setSaving(false) }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>

  return (
    <form onSubmit={handleSave}>
      <Alert type={alert?.type} text={alert?.text} onClose={() => setAlert(null)} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionCard title="Texte de présentation">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <InputField label="Titre de la section" value={form.title} onChange={set('title')}
              placeholder="Qui sommes-nous ?" />
            <InputField label="Contenu" value={form.content} onChange={set('content')}
              placeholder="Décrivez votre établissement, votre mission…" rows={6} />
          </div>
        </SectionCard>

        <SectionCard title="Statistiques clés (3 chiffres)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{
                display: 'grid', gridTemplateColumns: '120px 1fr',
                gap: 12, alignItems: 'end',
              }}>
                <InputField
                  label={`Valeur ${n}`}
                  value={form[`stat_${n}_value`] || ''}
                  onChange={set(`stat_${n}_value`)}
                  placeholder={['24/7', '+30', '100%'][n - 1]}
                />
                <InputField
                  label={`Label ${n}`}
                  value={form[`stat_${n}_label`] || ''}
                  onChange={set(`stat_${n}_label`)}
                  placeholder={['Orientation patient', 'Services coordonnés', 'Suivi structuré'][n - 1]}
                />
              </div>
            ))}
          </div>
        </SectionCard>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Btn type="submit" disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Btn>
        </div>
      </div>
    </form>
  )
}

/* ─── Tab 4: Messages de contact ───────────────────────────────────────────── */

function MessagesPage() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [filter, setFilter] = useState('all')
  const [alert, setAlert] = useState(null)

  useEffect(() => {
    webAdminApi.contacts()
      .then(({ data }) => setMessages(Array.isArray(data) ? data : []))
      .catch(() => setAlert({ type: 'error', text: 'Erreur de chargement des messages' }))
      .finally(() => setLoading(false))
  }, [])

  const markRead = async (id) => {
    try {
      await webAdminApi.markRead(id)
      setMessages(ms => ms.map(m => m.id === id ? { ...m, is_read: true } : m))
    } catch { /* silent */ }
  }

  const handleExpand = (id) => {
    setExpanded(prev => prev === id ? null : id)
    const msg = messages.find(m => m.id === id)
    if (msg && !msg.is_read) markRead(id)
  }

  const displayed = messages.filter(m =>
    filter === 'unread' ? !m.is_read :
    filter === 'read'   ? m.is_read  : true
  )

  const unreadCount = messages.filter(m => !m.is_read).length

  const fmtDate = (str) => {
    if (!str) return '—'
    try {
      return new Date(str).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch { return str }
  }

  const initials = (name) => name ? name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') : '?'

  return (
    <div>
      <Alert type={alert?.type} text={alert?.text} onClose={() => setAlert(null)} />

      <SectionCard
        title={`Messages reçus (${messages.length}${unreadCount ? ` · ${unreadCount} non lu${unreadCount > 1 ? 's' : ''}` : ''})`}
        action={
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'unread', 'read'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '4px 10px', borderRadius: 100, border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 600,
                background: filter === f ? colors.bleu : colors.gray100,
                color: filter === f ? '#fff' : colors.gray600,
              }}>
                {{ all: 'Tous', unread: 'Non lus', read: 'Lus' }[f]}
              </button>
            ))}
          </div>
        }
      >
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner /></div>
        ) : displayed.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '40px 20px', color: colors.gray400,
            fontSize: 14, border: `2px dashed ${colors.gray200}`, borderRadius: radius.sm,
          }}>
            {filter === 'unread' ? 'Aucun message non lu.' : 'Aucun message reçu pour le moment.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {displayed.map(msg => (
              <div key={msg.id} style={{
                borderRadius: radius.sm, border: `1px solid`,
                borderColor: msg.is_read ? colors.gray200 : '#bfdbfe',
                background: msg.is_read ? colors.white : '#eff6ff',
                overflow: 'hidden',
              }}>
                {/* Header row */}
                <button onClick={() => handleExpand(msg.id)} style={{
                  width: '100%', textAlign: 'left', background: 'none',
                  border: 'none', cursor: 'pointer', padding: '12px 14px',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: msg.is_read
                      ? `linear-gradient(135deg, ${colors.gray400}, ${colors.gray600})`
                      : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 12, fontWeight: 800,
                  }}>
                    {initials(msg.nom)}
                  </div>

                  {/* Name + preview */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: msg.is_read ? 500 : 700,
                      fontSize: 13, color: colors.gray900, marginBottom: 2,
                    }}>
                      {msg.nom}
                      {!msg.is_read && (
                        <span style={{
                          marginLeft: 8, display: 'inline-block',
                          width: 7, height: 7, borderRadius: '50%',
                          background: '#3b82f6', verticalAlign: 'middle',
                        }} />
                      )}
                    </div>
                    <div style={{
                      fontSize: 12, color: colors.gray500,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {msg.message}
                    </div>
                  </div>

                  {/* Date */}
                  <span style={{ fontSize: 11, color: colors.gray400, flexShrink: 0 }}>
                    {fmtDate(msg.created_at)}
                  </span>

                  {/* Chevron */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.gray400}
                    strokeWidth="2" strokeLinecap="round" style={{
                      flexShrink: 0,
                      transform: expanded === msg.id ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform 0.2s',
                    }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Expanded body */}
                {expanded === msg.id && (
                  <div style={{
                    borderTop: `1px solid ${msg.is_read ? colors.gray200 : '#bfdbfe'}`,
                    padding: '14px 16px',
                    background: msg.is_read ? colors.gray50 : '#dbeafe20',
                  }}>
                    {/* Contact info row */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 12 }}>
                      {msg.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: colors.gray600 }}>
                          <IcoMail />
                          <a href={`mailto:${msg.email}`} style={{ color: colors.bleu }}>{msg.email}</a>
                        </div>
                      )}
                      {msg.telephone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: colors.gray600 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.07 3.38 2 2 0 0 1 3.05 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z"/>
                          </svg>
                          {msg.telephone}
                        </div>
                      )}
                    </div>

                    {/* Message content */}
                    <div style={{
                      fontSize: 13, color: colors.gray800, lineHeight: 1.6,
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                      background: colors.white, borderRadius: radius.sm,
                      padding: '10px 14px', border: `1px solid ${colors.gray200}`,
                    }}>
                      {msg.message}
                    </div>

                    {msg.email && (
                      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                        <a href={`mailto:${msg.email}?subject=Re: votre message&body=Bonjour ${msg.nom},%0A%0A`}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '6px 14px', borderRadius: radius.sm,
                            background: colors.bleu, color: '#fff',
                            fontSize: 12, fontWeight: 600, textDecoration: 'none',
                          }}>
                          <IcoMail /> Répondre par email
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}

/* ─── Sub-items editor (features / steps / details) ───────────────────────── */
function ItemsEditor({ label, value = [], onChange, fields }) {
  const items = Array.isArray(value) ? value : []

  const update = (i, k, v) => {
    const next = items.map((it, idx) => idx === i ? { ...it, [k]: v } : it)
    onChange(next)
  }
  const add = () => onChange([...items, Object.fromEntries(fields.map(f => [f.key, '']))])
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i))

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: colors.gray700 }}>{label}</span>
        {items.length < 6 && (
          <Btn size="sm" variant="ghost" onClick={add}><IcoPlus /> Ajouter</Btn>
        )}
      </div>
      {items.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '16px', color: colors.gray400, fontSize: 12,
          border: `2px dashed ${colors.gray200}`, borderRadius: radius.sm,
        }}>Aucun élément — cliquez sur "Ajouter"</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((item, i) => (
            <div key={i} style={{
              border: `1px solid ${colors.gray200}`, borderRadius: radius.sm,
              padding: '10px 12px', background: colors.gray50,
            }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                {fields.map(f => (
                  <div key={f.key} style={{ flex: f.flex || '1 1 120px', minWidth: f.min || 80 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: colors.gray600, display: 'block', marginBottom: 4 }}>{f.label}</label>
                    {f.rows ? (
                      <textarea value={item[f.key] || ''} onChange={e => update(i, f.key, e.target.value)}
                        rows={f.rows} style={{
                          width: '100%', border: `1.5px solid ${colors.gray300}`,
                          borderRadius: radius.sm, padding: '6px 8px', fontSize: 12,
                          fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
                        }} />
                    ) : (
                      <input value={item[f.key] || ''} onChange={e => update(i, f.key, e.target.value)}
                        style={{
                          width: '100%', border: `1.5px solid ${colors.gray300}`,
                          borderRadius: radius.sm, padding: '6px 8px', fontSize: 12,
                          fontFamily: 'inherit', boxSizing: 'border-box',
                        }} />
                    )}
                  </div>
                ))}
                <Btn size="sm" variant="danger" onClick={() => remove(i)} title="Supprimer"><IcoTrash /></Btn>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Page Editor Modal ─────────────────────────────────────────────────────── */
function PageEditorModal({ page, onClose, onSaved }) {
  const [form, setForm] = useState({ ...page })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('base')

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSave = async () => {
    if (!form.title?.trim()) { setError('Le titre est requis'); return }
    setSaving(true); setError(null)
    try {
      await webAdminApi.updatePage(form.id, form)
      onSaved()
    } catch { setError("Erreur lors de l'enregistrement") }
    finally { setSaving(false) }
  }

  const INNER_TABS = [
    { key: 'base',     label: 'Infos' },
    { key: 'features', label: 'Points forts' },
    { key: 'steps',    label: 'Étapes' },
    { key: 'details',  label: 'Pratique' },
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '32px 16px', overflowY: 'auto',
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: colors.white, borderRadius: radius.lg, width: 680,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)', flexShrink: 0,
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${colors.gray200}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: colors.gray50, borderRadius: `${radius.lg} ${radius.lg} 0 0`,
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: colors.gray900 }}>
              {form.icon} {form.title}
            </div>
            <div style={{ fontSize: 11, color: colors.gray500, marginTop: 2 }}>{form.path}</div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: colors.gray500, fontSize: 22, lineHeight: 1, padding: '0 4px',
          }}>×</button>
        </div>

        {/* Inner tab nav */}
        <div style={{ display: 'flex', gap: 2, padding: '12px 20px 0', borderBottom: `1px solid ${colors.gray200}` }}>
          {INNER_TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '7px 16px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: tab === t.key ? colors.white : 'transparent',
              color: tab === t.key ? colors.bleu : colors.gray500,
              borderBottom: tab === t.key ? `2px solid ${colors.bleu}` : '2px solid transparent',
              marginBottom: -1,
            }}>{t.label}</button>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: 20 }}>
          <Alert type="error" text={error} onClose={() => setError(null)} />

          {tab === 'base' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 140px', gap: 12 }}>
                <InputField label="Icône" value={form.icon || ''} onChange={set('icon')} placeholder="🏥" />
                <InputField label="Titre *" value={form.title || ''} onChange={set('title')} placeholder="Titre de la page" />
                <InputField label="Tag / Catégorie" value={form.tag || ''} onChange={set('tag')} placeholder="Services médicaux" />
              </div>
              <InputField label="Sous-titre" value={form.subtitle || ''} onChange={set('subtitle')} placeholder="Une courte accroche descriptive…" />
              <InputField label="Description" value={form.description || ''} onChange={set('description')} placeholder="Paragraphe de présentation de la page…" rows={5} />
              {(form.path || '').startsWith('/payer/') && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <InputField
                    label="Info — libellé (ex: Numéro Wave)"
                    value={form.info?.label || ''}
                    onChange={e => setForm(f => ({ ...f, info: { ...f.info, label: e.target.value } }))}
                    placeholder="Numéro Wave"
                  />
                  <InputField
                    label="Info — valeur"
                    value={form.info?.value || ''}
                    onChange={e => setForm(f => ({ ...f, info: { ...f.info, value: e.target.value } }))}
                    placeholder="+221 77 XXX XX XX"
                  />
                </div>
              )}
            </div>
          )}

          {tab === 'features' && (
            <ItemsEditor
              label="Points forts (affichés comme cartes)"
              value={form.features}
              onChange={v => setForm(f => ({ ...f, features: v }))}
              fields={[
                { key: 'icon',  label: 'Icône', flex: '0 0 60px', min: 50 },
                { key: 'title', label: 'Titre', flex: '1 1 120px', min: 100 },
                { key: 'desc',  label: 'Description', flex: '2 1 200px', min: 150, rows: 2 },
              ]}
            />
          )}

          {tab === 'steps' && (
            <ItemsEditor
              label="Étapes du processus"
              value={form.steps}
              onChange={v => setForm(f => ({ ...f, steps: v }))}
              fields={[
                { key: 'num',   label: 'N°',   flex: '0 0 50px', min: 40 },
                { key: 'title', label: 'Titre', flex: '1 1 120px', min: 100 },
                { key: 'desc',  label: 'Description', flex: '2 1 200px', min: 150, rows: 2 },
              ]}
            />
          )}

          {tab === 'details' && (
            <ItemsEditor
              label="Informations pratiques"
              value={form.details}
              onChange={v => setForm(f => ({ ...f, details: v }))}
              fields={[
                { key: 'icon',  label: 'Icône', flex: '0 0 60px', min: 50 },
                { key: 'label', label: 'Label', flex: '1 1 120px', min: 100 },
                { key: 'value', label: 'Valeur', flex: '2 1 200px', min: 150 },
              ]}
            />
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px', borderTop: `1px solid ${colors.gray200}`,
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <Btn variant="ghost" onClick={onClose}>Annuler</Btn>
          <Btn onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer la page'}
          </Btn>
        </div>
      </div>
    </div>
  )
}

/* ─── Tab 7: Pages internes ─────────────────────────────────────────────────── */

const TAG_COLORS = {
  'Services médicaux': '#dbeafe',
  'Ma Santé':          '#dcfce7',
  'Formations':        '#fef9c3',
  'Patient / Usager':  '#ffe4e6',
  'Payer en ligne':    '#ede9fe',
  'Pages':             '#e0f2fe',
}

function PagesTab() {
  const [pages, setPages]   = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [alert, setAlert]   = useState(null)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await webAdminApi.adminPages()
      setPages(Array.isArray(data) ? data : [])
    } catch { setAlert({ type: 'error', text: 'Erreur de chargement des pages' }) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = pages.filter(p =>
    !search || p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.tag?.toLowerCase().includes(search.toLowerCase()) ||
    p.path?.toLowerCase().includes(search.toLowerCase())
  )

  const groups = filtered.reduce((acc, p) => {
    const k = p.tag || 'Autres'
    if (!acc[k]) acc[k] = []
    acc[k].push(p)
    return acc
  }, {})

  return (
    <div>
      <Alert type={alert?.type} text={alert?.text} onClose={() => setAlert(null)} />
      <SectionCard
        title={`Pages internes du site (${pages.length})`}
        action={
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
            style={{
              padding: '6px 12px', border: `1.5px solid ${colors.gray300}`,
              borderRadius: radius.sm, fontSize: 12, fontFamily: 'inherit', width: 200,
            }}
          />
        }
      >
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner /></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {Object.entries(groups).map(([tag, items]) => (
              <div key={tag}>
                <div style={{
                  fontSize: 11, fontWeight: 800, letterSpacing: 1,
                  color: colors.gray500, textTransform: 'uppercase', marginBottom: 8,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{
                    display: 'inline-block', padding: '2px 10px', borderRadius: 100,
                    background: TAG_COLORS[tag] || colors.gray100,
                    color: colors.gray700, textTransform: 'none', fontWeight: 700, fontSize: 12,
                  }}>{tag}</span>
                  <span style={{ color: colors.gray300 }}>({items.length})</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {items.map(page => (
                    <div key={page.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', borderRadius: radius.sm,
                      border: `1px solid ${colors.gray200}`, background: colors.white,
                      transition: 'box-shadow 0.15s',
                    }}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{page.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: colors.gray900 }}>
                          {page.title}
                        </div>
                        <div style={{ fontSize: 11, color: colors.gray400, marginTop: 1 }}>
                          {page.path}
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: colors.gray500, flexShrink: 0 }}>
                        {[page.features?.length, page.steps?.length, page.details?.length]
                          .filter(Boolean).join(' / ')} éléments
                      </div>
                      <Badge active={page.is_active} />
                      <Btn size="sm" variant="ghost" onClick={() => setEditing(page)}>
                        <IcoEdit /> Modifier
                      </Btn>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {editing && (
        <PageEditorModal
          page={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            load()
            setAlert({ type: 'success', text: 'Page mise à jour avec succès.' })
          }}
        />
      )}
    </div>
  )
}

/* ─── Stars display ────────────────────────────────────────────────────────── */
function Stars({ note = 5 }) {
  return (
    <span style={{ color: '#f59e0b', fontSize: 13, letterSpacing: 1 }}>
      {'★'.repeat(Math.max(0, Math.min(5, note)))}{'☆'.repeat(Math.max(0, 5 - Math.min(5, note)))}
    </span>
  )
}

/* ─── Testimonial Modal ─────────────────────────────────────────────────────── */

const EMPTY_TESTI = { nom: '', role: 'Patient', photo: '', texte: '', note: 5, is_active: true, sort_order: 0 }

function TestimonialModal({ item, onClose, onSaved }) {
  const isEdit = Boolean(item?.id)
  const [form, setForm] = useState(isEdit ? { ...item } : { ...EMPTY_TESTI })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const setCheck = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.checked }))

  const handleSave = async () => {
    if (!form.nom.trim()) { setError('Le nom est requis'); return }
    if (!form.texte.trim()) { setError('Le témoignage est requis'); return }
    setSaving(true); setError(null)
    try {
      if (isEdit) {
        await webAdminApi.updateTestimonial(form.id, form)
      } else {
        await webAdminApi.createTestimonial(form)
      }
      onSaved()
    } catch { setError("Erreur lors de l'enregistrement") }
    finally { setSaving(false) }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: colors.white, borderRadius: radius.lg, width: 520,
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${colors.gray200}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: colors.gray900 }}>
            {isEdit ? 'Modifier le témoignage' : 'Nouveau témoignage'}
          </h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: colors.gray500, fontSize: 22, lineHeight: 1, padding: '0 4px',
          }}>×</button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Alert type="error" text={error} onClose={() => setError(null)} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <InputField label="Nom du patient *" value={form.nom} onChange={set('nom')} placeholder="Aminata Sow" />
            <InputField label="Rôle / Titre" value={form.role || ''} onChange={set('role')} placeholder="Patient" />
          </div>
          <InputField label="Témoignage *" value={form.texte || ''} onChange={set('texte')}
            placeholder="Décrivez votre expérience…" rows={4} />
          <div style={{ display: 'grid', gridTemplateColumns: '120px 120px 1fr', gap: 12, alignItems: 'end' }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 600, color: colors.gray700, display: 'block', marginBottom: 5 }}>Note (1-5)</span>
              <select value={form.note ?? 5} onChange={e => setForm(f => ({ ...f, note: Number(e.target.value) }))} style={{
                width: '100%', padding: '9px 12px', border: `1.5px solid ${colors.gray300}`,
                borderRadius: radius.sm, fontSize: 13, fontFamily: 'inherit', background: colors.white,
              }}>
                {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} étoile{n > 1 ? 's' : ''}</option>)}
              </select>
            </div>
            <InputField label="Ordre" type="number" value={form.sort_order ?? 0} onChange={set('sort_order')} placeholder="0" />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 24 }}>
              <input type="checkbox" checked={!!form.is_active} onChange={setCheck('is_active')}
                style={{ width: 16, height: 16, accentColor: colors.bleu }} />
              <span style={{ fontSize: 13, color: colors.gray700 }}>Visible sur le site</span>
            </label>
          </div>
        </div>

        <div style={{
          padding: '14px 20px', borderTop: `1px solid ${colors.gray200}`,
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <Btn variant="ghost" onClick={onClose}>Annuler</Btn>
          <Btn onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer'}
          </Btn>
        </div>
      </div>
    </div>
  )
}

/* ─── Tab 5: Témoignages ────────────────────────────────────────────────────── */

function TestimonialsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [alert, setAlert] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await webAdminApi.testimonials()
      setItems(Array.isArray(data) ? data : [])
    } catch {
      setAlert({ type: 'error', text: 'Erreur de chargement des témoignages' })
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleToggle = async (id) => {
    try { await webAdminApi.toggleTestimonial(id); load() }
    catch { setAlert({ type: 'error', text: 'Erreur lors du changement de statut' }) }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Supprimer le témoignage de "${item.nom}" ?`)) return
    try { await webAdminApi.deleteTestimonial(item.id); load() }
    catch { setAlert({ type: 'error', text: 'Erreur lors de la suppression' }) }
  }

  return (
    <div>
      <Alert type={alert?.type} text={alert?.text} onClose={() => setAlert(null)} />
      <SectionCard
        title={`Témoignages patients (${items.length})`}
        action={<Btn size="sm" onClick={() => setModal('new')}><IcoPlus /> Nouveau témoignage</Btn>}
      >
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner /></div>
        ) : items.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '40px 20px', color: colors.gray400,
            fontSize: 14, border: `2px dashed ${colors.gray200}`, borderRadius: radius.sm,
          }}>
            Aucun témoignage. Cliquez sur "+ Nouveau témoignage" pour commencer.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map(item => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 14,
                padding: '12px 14px', borderRadius: radius.sm,
                border: `1px solid ${colors.gray200}`, background: colors.white,
              }}>
                {/* Avatar */}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${colors.bleu}, #0050a0)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 13, fontWeight: 800,
                }}>
                  {(item.nom || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('')}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: colors.gray900 }}>{item.nom}</span>
                    <span style={{ fontSize: 11, color: colors.gray400 }}>{item.role}</span>
                    <Stars note={item.note} />
                  </div>
                  <div style={{
                    fontSize: 12, color: colors.gray600, lineHeight: 1.5,
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>
                    {item.texte}
                  </div>
                </div>

                <span style={{ fontSize: 11, color: colors.gray400, flexShrink: 0 }}>#{item.sort_order}</span>
                <Badge active={item.is_active} />

                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <Btn size="sm" variant={item.is_active ? 'ghost' : 'success'}
                    onClick={() => handleToggle(item.id)}
                    title={item.is_active ? 'Désactiver' : 'Activer'}>
                    {item.is_active ? 'Désact.' : 'Activer'}
                  </Btn>
                  <Btn size="sm" variant="ghost" onClick={() => setModal(item)} title="Modifier"><IcoEdit /></Btn>
                  <Btn size="sm" variant="danger" onClick={() => handleDelete(item)} title="Supprimer"><IcoTrash /></Btn>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {modal && (
        <TestimonialModal
          item={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); setAlert({ type: 'success', text: 'Témoignage enregistré.' }) }}
        />
      )}
    </div>
  )
}

/* ─── FAQ Modal ─────────────────────────────────────────────────────────────── */

const EMPTY_FAQ = { question: '', reponse: '', is_active: true, sort_order: 0 }

function FaqModal({ item, onClose, onSaved }) {
  const isEdit = Boolean(item?.id)
  const [form, setForm] = useState(isEdit ? { ...item } : { ...EMPTY_FAQ })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const setCheck = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.checked }))

  const handleSave = async () => {
    if (!form.question.trim()) { setError('La question est requise'); return }
    if (!form.reponse.trim()) { setError('La réponse est requise'); return }
    setSaving(true); setError(null)
    try {
      if (isEdit) {
        await webAdminApi.updateFaq(form.id, form)
      } else {
        await webAdminApi.createFaq(form)
      }
      onSaved()
    } catch { setError("Erreur lors de l'enregistrement") }
    finally { setSaving(false) }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: colors.white, borderRadius: radius.lg, width: 540,
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${colors.gray200}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: colors.gray900 }}>
            {isEdit ? 'Modifier la question' : 'Nouvelle question FAQ'}
          </h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: colors.gray500, fontSize: 22, lineHeight: 1, padding: '0 4px',
          }}>×</button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Alert type="error" text={error} onClose={() => setError(null)} />
          <InputField label="Question *" value={form.question || ''} onChange={set('question')}
            placeholder="Comment prendre rendez-vous ?" />
          <InputField label="Réponse *" value={form.reponse || ''} onChange={set('reponse')}
            placeholder="Détaillez la réponse ici…" rows={5} />
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, alignItems: 'end' }}>
            <InputField label="Ordre d'affichage" type="number" value={form.sort_order ?? 0} onChange={set('sort_order')} placeholder="0" />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 24 }}>
              <input type="checkbox" checked={!!form.is_active} onChange={setCheck('is_active')}
                style={{ width: 16, height: 16, accentColor: colors.bleu }} />
              <span style={{ fontSize: 13, color: colors.gray700 }}>Visible sur le site</span>
            </label>
          </div>
        </div>

        <div style={{
          padding: '14px 20px', borderTop: `1px solid ${colors.gray200}`,
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <Btn variant="ghost" onClick={onClose}>Annuler</Btn>
          <Btn onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer'}
          </Btn>
        </div>
      </div>
    </div>
  )
}

/* ─── Tab 6: FAQ ────────────────────────────────────────────────────────────── */

function FaqPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [alert, setAlert] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await webAdminApi.faq()
      setItems(Array.isArray(data) ? data : [])
    } catch {
      setAlert({ type: 'error', text: 'Erreur de chargement de la FAQ' })
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (item) => {
    if (!window.confirm(`Supprimer la question "${item.question.slice(0, 50)}…" ?`)) return
    try { await webAdminApi.deleteFaq(item.id); load() }
    catch { setAlert({ type: 'error', text: 'Erreur lors de la suppression' }) }
  }

  return (
    <div>
      <Alert type={alert?.type} text={alert?.text} onClose={() => setAlert(null)} />
      <SectionCard
        title={`Questions fréquentes (${items.length})`}
        action={<Btn size="sm" onClick={() => setModal('new')}><IcoPlus /> Nouvelle question</Btn>}
      >
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner /></div>
        ) : items.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '40px 20px', color: colors.gray400,
            fontSize: 14, border: `2px dashed ${colors.gray200}`, borderRadius: radius.sm,
          }}>
            Aucune question FAQ. Cliquez sur "+ Nouvelle question" pour commencer.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map(item => (
              <div key={item.id} style={{
                padding: '12px 14px', borderRadius: radius.sm,
                border: `1px solid ${colors.gray200}`, background: colors.white,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  {/* Q badge */}
                  <div style={{
                    width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                    background: colors.bleu,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 12, fontWeight: 800,
                  }}>Q</div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: colors.gray900, marginBottom: 4 }}>
                      {item.question}
                    </div>
                    <div style={{
                      fontSize: 12, color: colors.gray600, lineHeight: 1.5,
                      overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    }}>
                      {item.reponse}
                    </div>
                  </div>

                  <span style={{ fontSize: 11, color: colors.gray400, flexShrink: 0 }}>#{item.sort_order}</span>
                  <Badge active={item.is_active} />

                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <Btn size="sm" variant="ghost" onClick={() => setModal(item)} title="Modifier"><IcoEdit /></Btn>
                    <Btn size="sm" variant="danger" onClick={() => handleDelete(item)} title="Supprimer"><IcoTrash /></Btn>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {modal && (
        <FaqModal
          item={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); setAlert({ type: 'success', text: 'Question FAQ enregistrée.' }) }}
        />
      )}
    </div>
  )
}

/* ─── Page principale avec tabs ────────────────────────────────────────────── */

const TABS = [
  { key: 'accueil',       label: 'Accueil',        icon: '🏠' },
  { key: 'slides',        label: 'Diaporama',       icon: '🖼️' },
  { key: 'about',         label: 'À propos',        icon: '📝' },
  { key: 'pages',         label: 'Pages',           icon: '📄' },
  { key: 'testimonials',  label: 'Témoignages',     icon: '💬' },
  { key: 'faq',           label: 'FAQ',             icon: '❓' },
  { key: 'messages',      label: 'Messages',        icon: '✉️' },
]

export default function ConfigPageWebPage() {
  const [activeTab, setActiveTab] = useState('accueil')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Page header */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.bleu} 0%, #003f7a 100%)`,
        borderRadius: radius.lg, padding: '18px 24px',
        display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: shadows.md,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: colors.orange,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20"/>
          </svg>
        </div>
        <div>
          <h1 style={{ margin: 0, color: '#fff', fontSize: 20, fontWeight: 800 }}>
            Configuration Page web
          </h1>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
            Gérez la vitrine publique de la plateforme : apparence, diaporama, contenu et messages
          </p>
        </div>
      </div>

      {/* Tab nav */}
      <div style={{
        display: 'flex', gap: 4,
        background: colors.gray100, borderRadius: radius.md,
        padding: 4, width: 'fit-content',
      }}>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 500,
            background: activeTab === tab.key ? colors.white : 'transparent',
            color: activeTab === tab.key ? colors.bleu : colors.gray600,
            boxShadow: activeTab === tab.key ? shadows.sm : 'none',
            transition: 'all 0.18s',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ fontSize: 14 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'accueil'      && <AccueilTab />}
        {activeTab === 'slides'       && <SlidesPage />}
        {activeTab === 'about'        && <AboutPage />}
        {activeTab === 'pages'        && <PagesTab />}
        {activeTab === 'testimonials' && <TestimonialsPage />}
        {activeTab === 'faq'          && <FaqPage />}
        {activeTab === 'messages'     && <MessagesPage />}
      </div>
    </div>
  )
}
