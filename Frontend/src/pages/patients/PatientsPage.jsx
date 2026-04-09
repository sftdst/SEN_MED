import { useEffect, useRef, useState } from 'react'
import { patientApi, partenaireApi } from '../../api'
import { colors, radius, shadows, typography, spacing } from '../../theme'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import PageHeader from '../../components/ui/PageHeader'
import Badge, { StatusBadge } from '../../components/ui/Badge'
import { showToast } from '../../components/ui/Toast'
import { FullPageSpinner } from '../../components/ui/Spinner'
import Pagination from '../../components/ui/Pagination'

// ── Constantes ──────────────────────────────────────────────
const EMPTY_RAPIDE = {
  first_name: '', last_name: '', dob: '', gender_id: '', mobile_number: '',
  company_id: '', type_couverture: '',
}

const EMPTY_COMPLET = {
  first_name: '', second_name: '', last_name: '', gender_id: '',
  dob: '', lieu_naissance: '', marital_status_id: '', nationality_id: '',
  country: 'Sénégal', city: '', address: '', address2: '', postal_code: '',
  contact_number: '', mobile_number: '', email_adress: '',
  emergency_contact_name: '', emergency_contact_number: '',
  pere_name: '', mere_name: '', profession: '', emplos: '',
  socite: '', lieu_travail: '', company_id: '', type_couverture: '',
  num_police: '', validate: '', family_doctor: '', ssn_no: '',
}

// ── Formatage ────────────────────────────────────────────────
const fmtN = (n) => Number(n || 0).toLocaleString('fr-FR')
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

// ── Composant champ de saisie ────────────────────────────────
function Field({ label, children, error, required }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {label && (
        <label style={{
          fontSize: '11px', fontWeight: 700,
          color: error ? colors.danger : colors.gray700,
          textTransform: 'uppercase', letterSpacing: '0.4px',
        }}>
          {label}{required && <span style={{ color: colors.danger, marginLeft: 2 }}>*</span>}
        </label>
      )}
      {children}
      {error && (
        <span style={{ fontSize: '11px', color: colors.danger, display: 'flex', alignItems: 'center', gap: 4 }}>
          ⚠ {error}
        </span>
      )}
    </div>
  )
}

function Inp({ label, name, value, onChange, disabled, type = 'text', error, required, placeholder, style = {} }) {
  const [focused, setFocused] = useState(false)
  const borderColor = error ? colors.danger : focused ? colors.bleu : colors.gray300
  return (
    <Field label={label} error={error} required={required}>
      <input
        type={type} name={name} value={value ?? ''} onChange={onChange}
        disabled={disabled} placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', boxSizing: 'border-box',
          border: `1.5px solid ${borderColor}`,
          borderRadius: radius.sm,
          padding: '9px 12px',
          fontSize: '13px', color: disabled ? colors.gray500 : colors.gray900,
          background: disabled ? colors.gray100 : colors.white,
          outline: 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: focused && !disabled ? `0 0 0 3px ${colors.bleu}18` : 'none',
          ...style,
        }}
      />
    </Field>
  )
}

function Sel({ label, name, value, onChange, options, placeholder, required, error }) {
  const [focused, setFocused] = useState(false)
  const borderColor = error ? colors.danger : focused ? colors.bleu : colors.gray300
  return (
    <Field label={label} error={error} required={required}>
      <select
        name={name} value={value ?? ''} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', boxSizing: 'border-box',
          border: `1.5px solid ${borderColor}`,
          borderRadius: radius.sm,
          padding: '9px 12px',
          fontSize: '13px', color: colors.gray900,
          background: colors.white, outline: 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: focused ? `0 0 0 3px ${colors.bleu}18` : 'none',
          cursor: 'pointer',
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  )
}

// ── Séparateur de section ────────────────────────────────────
function SectionTitle({ children, accent = colors.bleu, icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
      <div style={{ width: 4, height: 20, borderRadius: 2, background: accent, flexShrink: 0 }} />
      {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
      <span style={{ fontSize: '12px', fontWeight: 700, color: colors.gray800, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        {children}
      </span>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// PAGE PRINCIPALE PATIENTS
// ══════════════════════════════════════════════════════════
export default function PatientsPage() {
  const [patients,        setPatients]       = useState([])
  const [partenaires,     setPartenaires]    = useState([])
  const [metadata,        setMetadata]       = useState({})
  const [types,           setTypes]          = useState([])
  
  const [selected,        setSelected]       = useState(null)
  const [page,           setPage]           = useState(1)
  const [perPage,        setPerPage]        = useState(25)
  const [paginationMeta, setPaginationMeta] = useState(null)
  const [search,          setSearch]         = useState('')
  const [filterPartenaire, setFilterPartenaire] = useState('')
  const [filterType,       setFilterType]     = useState('')
  const [loadingList,     setLoadingList]    = useState(true)
  const [loadingMeta,     setLoadingMeta]    = useState(true)

  const [modalRapide,     setModalRapide]    = useState(false)
  const [modalComplet,    setModalComplet]   = useState(false)
  const [modalEdit,       setModalEdit]      = useState(false)
  const [modalView,       setModalView]      = useState(false)
  const [modalHistorique, setModalHistorique] = useState(false)
  const [modalRdv,        setModalRdv]       = useState(false)
  const [modalConsult,    setModalConsult]    = useState(false)
  const [modalDevis,      setModalDevis]     = useState(false)

  const [formRapide,      setFormRapide]     = useState(EMPTY_RAPIDE)
  const [formComplet,     setFormComplet]    = useState(EMPTY_COMPLET)
  const [form,            setForm]           = useState({})
  const [formErrors,      setFormErrors]     = useState({})
  const [saving,          setSaving]         = useState(false)
  const [confirmDel,      setConfirmDel]     = useState(false)

  const timer = useRef(null)

  // ── Chargement initial ─────────────────────────────────
  useEffect(() => {
    loadMetadata()
  }, [])

  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setPage(1)
      loadPatients(1, perPage)
    }, 400)
    return () => clearTimeout(timer.current)
  }, [search, perPage, filterPartenaire, filterType])

  // ── Chargement des métadonnées ──────────────────────────
  const loadMetadata = async () => {
    try {
      const [metaResp, partResp] = await Promise.all([
        patientApi.metadata(),
        partenaireApi.liste({}),
      ])
      setMetadata(metaResp.data.data || {})
      const partnerPayload = partResp.data?.data
      const partners = Array.isArray(partnerPayload) ? partnerPayload : partnerPayload?.data || partnerPayload || []
      setPartenaires(partners)
    } catch (err) {
      showToast('Erreur lors du chargement des données.', 'error')
    } finally {
      setLoadingMeta(false)
    }
  }

  // ── Chargement des patients ─────────────────────────────
  const loadPatients = (p = page, pp = perPage) => {
    setLoadingList(true)
    const params = { page: p, per_page: pp }
    if (search) params.search = search
    if (filterPartenaire) params.company_id = filterPartenaire
    if (filterType) params.type_couverture = filterType
    patientApi.liste(params)
      .then(r => {
        const payload = r.data?.data
        let list = []
        if (Array.isArray(payload)) {
          list = payload
        } else if (payload?.data && Array.isArray(payload.data)) {
          list = payload.data
          setPaginationMeta(payload.last_page ? payload : null)
        } else if (payload) {
          list = [payload]
        }
        setPatients(list)
      })
      .catch(() => showToast('Erreur de chargement.', 'error'))
      .finally(() => setLoadingList(false))
  }

  // ── Changement de page ─────────────────────────────────
  const handlePageChange = (newPage) => {
    setPage(newPage)
    loadPatients(newPage, perPage)
  }

  // ── Changement par page ────────────────────────────────
  const handlePerPageChange = (newPerPage) => {
    setPerPage(newPerPage)
    setPage(1)
    loadPatients(1, newPerPage)
  }

  // ── Chargement types couverture (au changement de partenaire) ──
  const loadTypesCouverture = async (partennaireId) => {
    try {
      const r = await patientApi.typesCouverture(partennaireId)
      setTypes(r.data.data || [])
    } catch {
      setTypes([])
    }
  }

  const handleChangePartenaire = (e, isRapide = true) => {
    const { value } = e.target
    if (isRapide) {
      setFormRapide(f => ({ ...f, company_id: value, type_couverture: '' }))
    } else {
      setFormComplet(f => ({ ...f, company_id: value, type_couverture: '' }))
    }
    if (value) {
      loadTypesCouverture(value)
    } else {
      setTypes([])
    }
  }

  // ── Modales ─────────────────────────────────────────────
  const closeModals = () => {
    setModalRapide(false)
    setModalComplet(false)
    setModalEdit(false)
    setModalView(false)
    setSelected(null)
    setForm({})
    setFormRapide(EMPTY_RAPIDE)
    setFormComplet(EMPTY_COMPLET)
    setFormErrors({})
  }

  // ── Sauvegarde ─────────────────────────────────────────
  const handleSaveRapide = async () => {
    setSaving(true)
    setFormErrors({})
    try {
      await patientApi.creerRapide(formRapide)
      showToast('Patient créé rapidement.')
      closeModals()
      loadPatients()
    } catch (err) {
      setFormErrors(err.response?.data?.errors || {})
      showToast(err.response?.data?.message || 'Erreur de validation.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveComplet = async () => {
    setSaving(true)
    setFormErrors({})
    try {
      await patientApi.creer(formComplet)
      showToast('Fiche patient créée.')
      closeModals()
      loadPatients()
    } catch (err) {
      setFormErrors(err.response?.data?.errors || {})
      showToast(err.response?.data?.message || 'Erreur de validation.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    setFormErrors({})
    try {
      await patientApi.modifier(selected.id_Rep, form)
      showToast('Patient modifié.')
      closeModals()
      loadPatients()
    } catch (err) {
      setFormErrors(err.response?.data?.errors || {})
      showToast(err.response?.data?.message || 'Erreur.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await patientApi.supprimer(selected.id_Rep)
      showToast('Patient supprimé.')
      setConfirmDel(false)
      closeModals()
      loadPatients()
    } catch {
      showToast('Erreur de suppression.', 'error')
    }
  }

  const openEditModal = async (patient) => {
    setSelected(patient)
    setForm(patient)
    setFormErrors({})
    setModalEdit(true)
    if (patient.company_id) {
      await loadTypesCouverture(patient.company_id)
    }
  }

  if (loadingMeta) return <FullPageSpinner />

  return (
    <div>
      <PageHeader
        title="Patients"
        subtitle="Gestion des dossiers patients et informations personnelles"
        actions={
          <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
            <Button onClick={() => setModalHistorique(true)} variant="warning" size="lg" style={{ flex: '1 1 0', minWidth: '140px' }}>Historique Visite</Button>
            <Button onClick={() => setModalRdv(true)} variant="warning" size="lg" style={{ flex: '1 1 0', minWidth: '140px' }}>Historique Rendez-vous</Button>
            <Button onClick={() => setModalConsult(true)} variant="warning" size="lg" style={{ flex: '1 1 0', minWidth: '140px' }}>Créer consultation</Button>
            <Button onClick={() => setModalDevis(true)} variant="warning" size="lg" style={{ flex: '1 1 0', minWidth: '140px' }}>Devis</Button>
            <Button onClick={() => { setModalRapide(true); setFormRapide(EMPTY_RAPIDE); setFormErrors({}) }} icon="⚡" variant="warning" size="lg" style={{ flex: '1 1 0', minWidth: '140px' }}>
              Création rapide
            </Button>
            <Button onClick={() => { setModalComplet(true); setFormComplet(EMPTY_COMPLET); setFormErrors({}) }} icon="➕" size="lg" style={{ flex: '1 1 0', minWidth: '140px' }}>
              Fiche complète
            </Button>
          </div>
        }
      />

      {/* ── FILTRES ──────────────────────────────────────── */}
      <div style={{
        background: colors.white,
        border: `1px solid ${colors.gray200}`,
        borderRadius: radius.md,
        boxShadow: shadows.sm,
        padding: `${spacing.sm} ${spacing.lg}`,
        marginBottom: spacing.lg,
        display: 'flex', gap: spacing.sm, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: colors.gray400, pointerEvents: 'none' }}>
            🔍
          </span>
          <input
            placeholder="Rechercher (nom, prénom, code, téléphone, NSS, email, assureur, type couverture)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm,
              padding: '8px 10px 8px 32px', fontSize: '13px', outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = colors.bleu}
            onBlur={e => e.target.style.borderColor = colors.gray300}
          />
        </div>
        <select
          value={filterPartenaire}
          onChange={e => setFilterPartenaire(e.target.value)}
          style={{
            padding: '8px 12px', fontSize: '13px',
            border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm,
            background: colors.white, color: colors.gray700,
            cursor: 'pointer', minWidth: 180,
          }}
        >
          <option value="">Tous les partenaires</option>
          {partenaires.map(p => (
            <option key={p.id_Rep} value={p.id_Rep}>{p.Nom}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          style={{
            padding: '8px 12px', fontSize: '13px',
            border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm,
            background: colors.white, color: colors.gray700,
            cursor: 'pointer', minWidth: 160,
          }}
        >
          <option value="">Tous les types</option>
          {types.map(t => (
            <option key={t.Nom} value={t.Nom}>{t.Nom}</option>
          ))}
        </select>
        {(search || filterPartenaire || filterType) && (
          <button
            onClick={() => { setSearch(''); setFilterPartenaire(''); setFilterType('') }}
            style={{
              border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm,
              padding: '8px 12px', fontSize: '12px', background: colors.white,
              cursor: 'pointer', color: colors.gray600, fontWeight: 600,
            }}
          >
            × Effacer
          </button>
        )}
      </div>

      {/* ── LISTE ────────────────────────────────────────── */}
      {loadingList ? <FullPageSpinner /> : (
        <div style={{
          background: colors.white,
          border: `1px solid ${colors.gray200}`,
          borderRadius: radius.md,
          boxShadow: shadows.sm,
          overflow: 'hidden',
        }}>
          {patients.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: colors.gray400 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: colors.gray600, marginBottom: 6 }}>
                Aucun patient trouvé
              </div>
              <div style={{ fontSize: '12px' }}>
                {search ? 'Modifiez vos critères de recherche.' : 'Commencez par créer un premier patient.'}
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: colors.gray50, borderBottom: `2px solid ${colors.gray200}` }}>
                    {['#', 'Patient', 'Âge', 'Contact', 'Partenaire', 'Couverture', 'Actions'].map((h, i) => (
                      <th key={i} style={{
                        padding: `${spacing.sm} ${spacing.md}`,
                        textAlign: i === 0 ? 'center' : 'left',
                        fontSize: '11px', fontWeight: 700, color: colors.bleu,
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                        whiteSpace: 'nowrap',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p, i) => {
                    const isActive = selected?.id_Rep === p.id_Rep
                    const rowBg = isActive ? `${colors.bleu}06` : i % 2 === 0 ? colors.white : colors.gray50

                    return (
                      <tr
                        key={p.id_Rep}
                        style={{ background: rowBg, borderBottom: `1px solid ${colors.gray100}` }}
                      >
                        <td style={{ padding: spacing.md, textAlign: 'center', fontWeight: 600, color: colors.gray500, fontSize: '12px', width: 44 }}>
                          {i + 1}
                        </td>
                        <td style={{ padding: spacing.md }}>
                          <div>
                            <div style={{ fontWeight: 700, color: colors.gray900, fontSize: '13px' }}>
                              {p.patient_name}
                            </div>
                            <div style={{ fontSize: '11px', color: colors.gray500 }}>
                              {p.patient_code} • {fmtDate(p.dob)}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: spacing.md, textAlign: 'center' }}>
                          <Badge variant="info">{p.age_patient} ans</Badge>
                        </td>
                        <td style={{ padding: spacing.md, fontSize: '12px', color: colors.gray700 }}>
                          {p.mobile_number || p.contact_number || '—'}
                        </td>
                        <td style={{ padding: spacing.md, fontSize: '12px', color: colors.gray700 }}>
                          {p.company_id ? partenaires.find(x => x.id_Rep == p.company_id)?.Nom || '—' : '—'}
                        </td>
                        <td style={{ padding: spacing.md, fontSize: '12px' }}>
                          {p.type_couverture ? <Badge variant="success">{p.type_couverture}</Badge> : <span style={{ color: colors.gray400 }}>—</span>}
                        </td>
                        <td style={{ padding: spacing.md, textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: spacing.xs, justifyContent: 'flex-end' }}>
                            <button style={{ background: 'none', border: 'none', color: colors.bleu, cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                              onClick={() => { setSelected(p); setModalView(true) }}>
                              👁 Voir
                            </button>
                            <button style={{ background: 'none', border: 'none', color: colors.warning, cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                              onClick={() => openEditModal(p)}>
                              ✏ Éditer
                            </button>
                            <button style={{ background: 'none', border: 'none', color: colors.danger, cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                              onClick={() => { setSelected(p); setConfirmDel(true) }}>
                              🗑 Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <Pagination 
                meta={paginationMeta} 
                onPageChange={handlePageChange} 
                onPerPageChange={handlePerPageChange} 
              />
            </div>
          )}
        </div>
      )}

      {/* ── MODAL CRÉATION RAPIDE ────────────────────────── */}
      <Modal
        open={modalRapide}
        onClose={closeModals}
        title="Création rapide - Patient"
        width={600}
        footer={
          <>
            <Button variant="ghost" onClick={closeModals}>Annuler</Button>
            <Button onClick={handleSaveRapide} disabled={saving}>
              {saving ? 'Création...' : 'Créer'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: spacing.lg }}>
          <SectionTitle icon="👤">Identité</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
            <Inp label="Prénom" name="first_name" value={formRapide.first_name} onChange={e => setFormRapide(f => ({ ...f, first_name: e.target.value }))} required placeholder="Prénom" />
            <Inp label="Nom" name="last_name" value={formRapide.last_name} onChange={e => setFormRapide(f => ({ ...f, last_name: e.target.value }))} required placeholder="Nom" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
            <Inp label="Date de naissance" name="dob" value={formRapide.dob} onChange={e => setFormRapide(f => ({ ...f, dob: e.target.value }))} type="date" required />
            <Sel label="Sexe" name="gender_id" value={formRapide.gender_id} onChange={e => setFormRapide(f => ({ ...f, gender_id: e.target.value }))} options={metadata.genders || []} placeholder="Sélectionner..." />
          </div>

          <SectionTitle icon="📱">Contact</SectionTitle>
          <Inp label="Mobile" name="mobile_number" value={formRapide.mobile_number} onChange={e => setFormRapide(f => ({ ...f, mobile_number: e.target.value }))} placeholder="+221 7X XXX XX XX" />

          <SectionTitle icon="🛡️">Partenaire & Couverture</SectionTitle>
          <Sel label="Partenaire (Assureur)" name="company_id" value={formRapide.company_id} onChange={e => handleChangePartenaire(e, true)} options={partenaires.map(p => ({ value: p.id_Rep, label: p.Nom }))} placeholder="Sélectionner..." />
          <Sel label="Type de couverture" name="type_couverture" value={formRapide.type_couverture} onChange={e => setFormRapide(f => ({ ...f, type_couverture: e.target.value }))} options={types.map(t => ({ value: t.Nom, label: t.Nom }))} placeholder="Sélectionner..." disabled={!formRapide.company_id} />
        </div>
      </Modal>

      {/* ── MODAL CRÉATION COMPLÈTE ─────────────────────── */}
      <Modal
        open={modalComplet}
        onClose={closeModals}
        title="Fiche complète - Patient"
        width={900}
        footer={
          <>
            <Button variant="ghost" onClick={closeModals}>Annuler</Button>
            <Button onClick={handleSaveComplet} disabled={saving}>
              {saving ? 'Création...' : 'Créer'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: spacing.lg, maxHeight: '70vh', overflowY: 'auto', paddingRight: spacing.sm }}>
          <SectionTitle icon="👤">Identité</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: spacing.md }}>
            <Inp label="Prénom" name="first_name" value={formComplet.first_name} onChange={e => setFormComplet(f => ({ ...f, first_name: e.target.value }))} required placeholder="Prénom" />
            <Inp label="Deuxième prénom" name="second_name" value={formComplet.second_name} onChange={e => setFormComplet(f => ({ ...f, second_name: e.target.value }))} placeholder="2e prénom" />
            <Inp label="Nom" name="last_name" value={formComplet.last_name} onChange={e => setFormComplet(f => ({ ...f, last_name: e.target.value }))} required placeholder="Nom" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: spacing.md }}>
            <Inp label="Date de naissance" name="dob" value={formComplet.dob} onChange={e => setFormComplet(f => ({ ...f, dob: e.target.value }))} type="date" required />
            <Inp label="Lieu de naissance" name="lieu_naissance" value={formComplet.lieu_naissance} onChange={e => setFormComplet(f => ({ ...f, lieu_naissance: e.target.value }))} placeholder="Ville, région..." />
            <Sel label="Sexe" name="gender_id" value={formComplet.gender_id} onChange={e => setFormComplet(f => ({ ...f, gender_id: e.target.value }))} options={metadata.genders || []} placeholder="Sélectionner..." />
          </div>

          <SectionTitle icon="💍">Situation civile</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
            <Sel label="Situation matrimoniale" name="marital_status_id" value={formComplet.marital_status_id} onChange={e => setFormComplet(f => ({ ...f, marital_status_id: e.target.value }))} options={metadata.marital_statuses || []} placeholder="Sélectionner..." />
            <Sel label="Nationalité" name="nationality_id" value={formComplet.nationality_id} onChange={e => setFormComplet(f => ({ ...f, nationality_id: e.target.value }))} options={metadata.countries || []} placeholder="Sélectionner..." />
          </div>

          <SectionTitle icon="📍">Adresse</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: spacing.md }}>
            <Sel label="Pays" name="country" value={formComplet.country} onChange={e => setFormComplet(f => ({ ...f, country: e.target.value }))} options={metadata.countries || []} placeholder="Sélectionner..." />
            <Inp label="Ville" name="city" value={formComplet.city} onChange={e => setFormComplet(f => ({ ...f, city: e.target.value }))} placeholder="Dakar" />
          </div>
          <Inp label="Adresse" name="address" value={formComplet.address} onChange={e => setFormComplet(f => ({ ...f, address: e.target.value }))} placeholder="Rue, quartier, BP..." />
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: spacing.md }}>
            <Inp label="Adresse 2 (complément)" name="address2" value={formComplet.address2} onChange={e => setFormComplet(f => ({ ...f, address2: e.target.value }))} placeholder="Immeuble, étage..." />
            <Inp label="Code postal" name="postal_code" value={formComplet.postal_code} onChange={e => setFormComplet(f => ({ ...f, postal_code: e.target.value }))} placeholder="14000" />
          </div>

          <SectionTitle icon="📞">Contact</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
            <Inp label="Téléphone" name="contact_number" value={formComplet.contact_number} onChange={e => setFormComplet(f => ({ ...f, contact_number: e.target.value }))} placeholder="+221 33 XXX XX XX" />
            <Inp label="Mobile" name="mobile_number" value={formComplet.mobile_number} onChange={e => setFormComplet(f => ({ ...f, mobile_number: e.target.value }))} placeholder="+221 7X XXX XX XX" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
            <Inp label="Email" name="email_adress" value={formComplet.email_adress} onChange={e => setFormComplet(f => ({ ...f, email_adress: e.target.value }))} type="email" placeholder="client@exemple.com" />
            <Inp label="Contact d'urgence" name="emergency_contact_name" value={formComplet.emergency_contact_name} onChange={e => setFormComplet(f => ({ ...f, emergency_contact_name: e.target.value }))} placeholder="Nom du contact" />
          </div>

          <SectionTitle icon="👨‍👩‍👧‍👦">Famille</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
            <Inp label="Père" name="pere_name" value={formComplet.pere_name} onChange={e => setFormComplet(f => ({ ...f, pere_name: e.target.value }))} placeholder="Nom du père" />
            <Inp label="Mère" name="mere_name" value={formComplet.mere_name} onChange={e => setFormComplet(f => ({ ...f, mere_name: e.target.value }))} placeholder="Nom de la mère" />
          </div>

          <SectionTitle icon="💼">Profession</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: spacing.md }}>
            <Inp label="Profession" name="profession" value={formComplet.profession} onChange={e => setFormComplet(f => ({ ...f, profession: e.target.value }))} placeholder="Ex : Infirmier" />
            <Inp label="Employeur" name="emplos" value={formComplet.emplos} onChange={e => setFormComplet(f => ({ ...f, emplos: e.target.value }))} placeholder="Nom de l'entreprise" />
            <Inp label="Entreprise / Société" name="socite" value={formComplet.socite} onChange={e => setFormComplet(f => ({ ...f, socite: e.target.value }))} placeholder="SARL..." />
          </div>
          <Inp label="Lieu de travail" name="lieu_travail" value={formComplet.lieu_travail} onChange={e => setFormComplet(f => ({ ...f, lieu_travail: e.target.value }))} placeholder="Adresse du lieu de travail" />

          <SectionTitle icon="🛡️">Couverture & Assurance</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
            <Sel label="Partenaire (Assureur)" name="company_id" value={formComplet.company_id} onChange={e => handleChangePartenaire(e, false)} options={partenaires.map(p => ({ value: p.id_Rep, label: p.Nom }))} placeholder="Sélectionner..." />
            <Sel label="Type de couverture" name="type_couverture" value={formComplet.type_couverture} onChange={e => setFormComplet(f => ({ ...f, type_couverture: e.target.value }))} options={types.map(t => ({ value: t.Nom, label: t.Nom }))} placeholder="Sélectionner..." disabled={!formComplet.company_id} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
            <Inp label="Numéro de police" name="num_police" value={formComplet.num_police} onChange={e => setFormComplet(f => ({ ...f, num_police: e.target.value }))} placeholder="POL-001" />
            <Inp label="Valide jusqu'au" name="validate" value={formComplet.validate} onChange={e => setFormComplet(f => ({ ...f, validate: e.target.value }))} type="date" />
          </div>

          <SectionTitle icon="👨‍⚕️">Médecin de famille</SectionTitle>
          <Inp label="Nom du médecin" name="family_doctor" value={formComplet.family_doctor} onChange={e => setFormComplet(f => ({ ...f, family_doctor: e.target.value }))} placeholder="Dr. Nom Prénom" />

          <SectionTitle icon="🆔">Données administratives</SectionTitle>
          <Inp label="Numéro de sécurité sociale" name="ssn_no" value={formComplet.ssn_no} onChange={e => setFormComplet(f => ({ ...f, ssn_no: e.target.value }))} placeholder="NSS-123456" />
        </div>
      </Modal>

      {/* ── MODAL ÉDITION ────────────────────────────────── */}
      <Modal
        open={modalEdit}
        onClose={closeModals}
        title={`Éditer - ${selected?.patient_name}`}
        width={900}
        footer={
          <>
            <Button variant="ghost" onClick={closeModals}>Annuler</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? 'Modification...' : 'Enregistrer'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: spacing.lg, maxHeight: '70vh', overflowY: 'auto', paddingRight: spacing.sm }}>
          <SectionTitle icon="👤">Identité</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: spacing.md }}>
            <Inp label="Prénom" name="first_name" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
            <Inp label="Deuxième prénom" name="second_name" value={form.second_name} onChange={e => setForm(f => ({ ...f, second_name: e.target.value }))} />
            <Inp label="Nom" name="last_name" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: spacing.md }}>
            <Inp label="Date de naissance" name="dob" value={form.dob?.substring(0, 10)} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} type="date" />
            <Inp label="Lieu de naissance" name="lieu_naissance" value={form.lieu_naissance} onChange={e => setForm(f => ({ ...f, lieu_naissance: e.target.value }))} />
            <Sel label="Sexe" name="gender_id" value={form.gender_id} onChange={e => setForm(f => ({ ...f, gender_id: e.target.value }))} options={metadata.genders || []} placeholder="Sélectionner..." />
          </div>

          <SectionTitle icon="📞">Contact</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
            <Inp label="Téléphone" name="contact_number" value={form.contact_number} onChange={e => setForm(f => ({ ...f, contact_number: e.target.value }))} />
            <Inp label="Mobile" name="mobile_number" value={form.mobile_number} onChange={e => setForm(f => ({ ...f, mobile_number: e.target.value }))} />
          </div>
          <Inp label="Email" name="email_adress" value={form.email_adress} onChange={e => setForm(f => ({ ...f, email_adress: e.target.value }))} type="email" />

          <SectionTitle icon="🛡️">Couverture & Assurance</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
            <Sel label="Partenaire" name="company_id" value={form.company_id} onChange={e => handleChangePartenaire(e, false)} options={partenaires.map(p => ({ value: p.id_Rep, label: p.Nom }))} placeholder="Sélectionner..." />
            <Sel label="Type de couverture" name="type_couverture" value={form.type_couverture} onChange={e => setForm(f => ({ ...f, type_couverture: e.target.value }))} options={types.map(t => ({ value: t.Nom, label: t.Nom }))} placeholder="Sélectionner..." disabled={!form.company_id} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
            <Inp label="Numéro de police" name="num_police" value={form.num_police} onChange={e => setForm(f => ({ ...f, num_police: e.target.value }))} />
            <Inp label="Valide jusqu'au" name="validate" value={form.validate?.substring(0, 10)} onChange={e => setForm(f => ({ ...f, validate: e.target.value }))} type="date" />
          </div>
        </div>
      </Modal>

      {/* ── MODAL VUE ────────────────────────────────────── */}
      <Modal
        open={modalView}
        onClose={closeModals}
        title={`Détails - ${selected?.patient_name}`}
        width={700}
        footer={
          <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'space-between', width: '100%' }}>
            <Button variant="ghost" onClick={closeModals}>Fermer</Button>
            <div style={{ display: 'flex', gap: spacing.sm }}>
              <Button variant="danger" onClick={() => { setModalView(false); setConfirmDel(true) }}>Supprimer</Button>
              <Button onClick={() => { setModalView(false); openEditModal(selected) }}>Éditer</Button>
            </div>
          </div>
        }
      >
        {selected && (
          <div style={{ display: 'grid', gap: spacing.lg }}>
            <div style={{ padding: spacing.lg, background: colors.blue50, borderRadius: radius.md, borderLeft: `4px solid ${colors.bleu}` }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: colors.gray500, fontWeight: 700 }}>Patient</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: colors.gray900 }}>{selected.patient_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: colors.gray500, fontWeight: 700 }}>Code</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: colors.bleu }}>{selected.patient_code}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: colors.gray500, fontWeight: 700 }}>Âge</div>
                  <div style={{ fontSize: '13px' }}>{selected.age_patient} ans</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: colors.gray500, fontWeight: 700 }}>Sexe</div>
                  <div style={{ fontSize: '13px' }}>{selected.gender_id === 'M' ? 'Masculin' : selected.gender_id === 'F' ? 'Féminin' : 'Autre'}</div>
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: colors.gray700, marginBottom: spacing.sm, textTransform: 'uppercase' }}>Coordonnées</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md, fontSize: '13px', color: colors.gray700 }}>
                <div>
                  <div style={{ fontSize: '10px', color: colors.gray500, fontWeight: 600 }}>Téléphone</div>
                  {selected.contact_number || '—'}
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: colors.gray500, fontWeight: 600 }}>Mobile</div>
                  {selected.mobile_number || '—'}
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <div style={{ fontSize: '10px', color: colors.gray500, fontWeight: 600 }}>Email</div>
                  {selected.email_adress || '—'}
                </div>
              </div>
            </div>

            {selected.company_id && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: colors.gray700, marginBottom: spacing.sm, textTransform: 'uppercase' }}>Couverture</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md, fontSize: '13px', color: colors.gray700 }}>
                  <div>
                    <div style={{ fontSize: '10px', color: colors.gray500, fontWeight: 600 }}>Partenaire</div>
                    {partenaires.find(x => x.id_Rep == selected.company_id)?.Nom || '—'}
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: colors.gray500, fontWeight: 600 }}>Type</div>
                    {selected.type_couverture || '—'}
                  </div>
                  {selected.num_police && (
                    <>
                      <div>
                        <div style={{ fontSize: '10px', color: colors.gray500, fontWeight: 600 }}>N° Police</div>
                        {selected.num_police}
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: colors.gray500, fontWeight: 600 }}>Valide jusqu'au</div>
                        {fmtDate(selected.validate)}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── MODAL HISTORIQUE VISITE ────────────────────────── */}
      <Modal
        open={modalHistorique}
        onClose={() => setModalHistorique(false)}
        title="Historique des Visites"
        width={700}
      >
        <div style={{ padding: spacing.md, textAlign: 'center', color: colors.gray500 }}>
          <p>Sélectionnez un patient pour voir son historique de visites.</p>
          <p style={{ fontSize: '12px' }}>(Fonctionnalité en cours de développement)</p>
        </div>
      </Modal>

      {/* ── MODAL HISTORIQUE RENDEZ-VOUS ────────────────────── */}
      <Modal
        open={modalRdv}
        onClose={() => setModalRdv(false)}
        title="Historique des Rendez-vous"
        width={700}
      >
        <div style={{ padding: spacing.md, textAlign: 'center', color: colors.gray500 }}>
          <p>Sélectionnez un patient pour voir son historique de rendez-vous.</p>
          <p style={{ fontSize: '12px' }}>(Fonctionnalité en cours de développement)</p>
        </div>
      </Modal>

      {/* ── MODAL CRÉER CONSULTATION ───────────────────────── */}
      <Modal
        open={modalConsult}
        onClose={() => setModalConsult(false)}
        title="Créer une Consultation"
        width={700}
      >
        <div style={{ padding: spacing.md, textAlign: 'center', color: colors.gray500 }}>
          <p>Sélectionnez un patient pour créer une consultation.</p>
          <p style={{ fontSize: '12px' }}>(Fonctionnalité en cours de développement)</p>
        </div>
      </Modal>

      {/* ── MODAL DEVIS ────────────────────────────────────── */}
      <Modal
        open={modalDevis}
        onClose={() => setModalDevis(false)}
        title="Devis"
        width={700}
      >
        <div style={{ padding: spacing.md, textAlign: 'center', color: colors.gray500 }}>
          <p>Sélectionnez un patient pour créer un devis.</p>
          <p style={{ fontSize: '12px' }}>(Fonctionnalité en cours de développement)</p>
        </div>
      </Modal>

      {/* ── CONFIRMATION SUPPRESSION ─────────────────────── */}
      <ConfirmDialog
        open={confirmDel}
        onClose={() => setConfirmDel(false)}
        onConfirm={handleDelete}
        title="Supprimer le patient ?"
        message={`Êtes-vous sûr de vouloir supprimer "${selected?.patient_name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
      />
    </div>
  )
}
