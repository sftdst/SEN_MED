import { useEffect, useState } from 'react'
import { personnelApi, departementApi } from '../../api'
import { colors, radius, shadows } from '../../theme'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { StatusBadge } from '../../components/ui/Badge'
import { showToast } from '../../components/ui/Toast'
import { FullPageSpinner } from '../../components/ui/Spinner'
import Pagination from '../../components/ui/Pagination'

// ── Données statiques ─────────────────────────────────────
const emptyRapide = { first_name: '', last_name: '', gender_id: '', staff_type: '', contact_number: '', IDgen_mst_Departement: '' }

const emptyComplet = {
  first_name: '', last_name: '', second_name: '', gender_id: '', titre_id: '',
  staff_type: '', specialization: '', contact_number: '', phone_number: '',
  email_adress: '', email_pro: '', date_of_birth: '', nationality_id: '',
  groupe_sanguin: '', IDgen_mst_Departement: '', status_id: 1,
  address: '', autre_adress: '', city: '', code_postal: '',
  ville_principal: '', ville_secondaire: '', country_id: '', type_adresse: '',
  ID_pro: '', type_exercie: '', secteur: '', lieu_exercice: '',
  Joining_date: '', End_of_service_date: '', personnel: 0, consult: 0,
}

const STAFF_TYPES = [
  { value: 'medecin',          label: 'Médecin' },
  { value: 'infirmier',        label: 'Infirmier(e)' },
  { value: 'technicien',       label: 'Technicien(ne)' },
  { value: 'administratif',    label: 'Administratif' },
  { value: 'sage_femme',       label: 'Sage-femme' },
  { value: 'kinesitherapeute', label: 'Kinésithérapeute' },
  { value: 'pharmacien',       label: 'Pharmacien(ne)' },
  { value: 'autre',            label: 'Autre' },
]

const GROUPES_SANGUINS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => ({ value: g, label: g }))
const GENRES = [{ value: 'masculin', label: 'Masculin' }, { value: 'feminin', label: 'Féminin' }]

const TYPE_CONFIG = {
  medecin:          { color: colors.bleu,   bg: colors.infoBg,    label: 'Médecin',         icon: '🩺' },
  infirmier:        { color: '#2e7d32',      bg: colors.successBg, label: 'Infirmier(e)',    icon: '💉' },
  technicien:       { color: '#f57c00',      bg: colors.warningBg, label: 'Technicien(ne)',  icon: '🔬' },
  administratif:    { color: '#6a1b9a',      bg: '#f3e5f5',        label: 'Administratif',   icon: '📋' },
  sage_femme:       { color: '#e91e63',      bg: '#fce4ec',        label: 'Sage-femme',      icon: '🤱' },
  kinesitherapeute: { color: '#00838f',      bg: '#e0f7fa',        label: 'Kinésithérapeute',icon: '🏃' },
  pharmacien:       { color: '#558b2f',      bg: '#f1f8e9',        label: 'Pharmacien(ne)',  icon: '💊' },
  autre:            { color: colors.gray600, bg: colors.gray100,   label: 'Autre',           icon: '👤' },
}

// ── Helpers visuels ───────────────────────────────────────
function InfoRow({ icon, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: colors.gray600 }}>
      <span>{icon}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  )
}

const actionBtnStyle = (color, bg) => ({
  flex: 1, padding: '6px 4px', border: 'none', borderRadius: radius.sm,
  background: bg, color, fontSize: 12, fontWeight: 600,
  cursor: 'pointer', textAlign: 'center', transition: 'opacity 0.15s',
})

function Section({ title }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: colors.orange,
      textTransform: 'uppercase', letterSpacing: '0.07em',
      marginBottom: 12, paddingBottom: 6,
      borderBottom: `2px solid ${colors.orangeLight}`,
    }}>
      {title}
    </div>
  )
}

// ── Carte Personnel ───────────────────────────────────────
function PersonnelCard({ row, onView, onEdit, onDelete }) {
  const cfg = TYPE_CONFIG[row.staff_type] || TYPE_CONFIG.autre
  const isFemme = row.gender_id === 'feminin'
  const initials = (row.first_name?.[0] || '') + (row.last_name?.[0] || '')
  const avatarColor = isFemme ? '#e91e63' : colors.bleu
  const avatarBg    = isFemme ? '#fce4ec' : `${colors.bleu}18`
  const avatarBorder= isFemme ? '#f48fb133' : `${colors.bleu}33`

  return (
    <div
      style={{
        background: colors.white, borderRadius: radius.md,
        boxShadow: shadows.sm, overflow: 'hidden',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)'
        e.currentTarget.style.boxShadow = shadows.md
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = shadows.sm
      }}
    >
      {/* Bandeau couleur haut */}
      <div style={{
        height: 5,
        background: `linear-gradient(90deg, ${cfg.color}, ${isFemme ? '#e91e63' : colors.orange})`,
      }} />

      <div style={{ padding: '16px 18px' }}>
        {/* En-tête carte */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
            background: avatarBg, color: avatarColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 18,
            border: `2px solid ${avatarBorder}`,
          }}>
            {initials}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: 700, fontSize: 14, color: colors.bleu,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {row.staff_name}
            </div>
            <div style={{ fontSize: 11, color: colors.gray400, marginTop: 2 }}>
              #{row.user_id}{row.titre_id ? ` · ${row.titre_id}` : ''}
            </div>
            <div style={{ marginTop: 6 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: cfg.bg, color: cfg.color,
                borderRadius: radius.full, padding: '3px 10px',
                fontSize: 11, fontWeight: 600,
              }}>
                {cfg.icon} {cfg.label}
              </span>
            </div>
          </div>

          <StatusBadge status={row.status_id} />
        </div>

        {/* Infos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14, minHeight: 54 }}>
          {row.departement?.NomDepartement && <InfoRow icon="🏥" value={row.departement.NomDepartement} />}
          {row.specialization              && <InfoRow icon="🎓" value={row.specialization} />}
          {row.contact_number              && <InfoRow icon="📞" value={row.contact_number} />}
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex', gap: 6,
          borderTop: `1px solid ${colors.gray100}`, paddingTop: 12,
        }}>
          <button onClick={onView}   style={actionBtnStyle(colors.bleu,   colors.infoBg)}>👁️ Voir</button>
          <button onClick={onEdit}   style={actionBtnStyle(colors.orange,  colors.orangeLight)}>✏️ Modifier</button>
          <button onClick={onDelete} style={actionBtnStyle(colors.danger,  colors.dangerBg)}>🗑️</button>
        </div>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────
export default function PersonnelsPage() {
  const [data, setData]                     = useState([])
  const [paginationMeta, setPaginationMeta] = useState(null)
  const [page, setPage]                     = useState(1)
  const [perPage, setPerPage]               = useState(15)
  const [departements, setDeps]             = useState([])
  const [loading, setLoading]               = useState(true)
  const [search, setSearch]                 = useState('')
  const [filterDep, setFilterDep]           = useState('')
  const [filterType, setFilterType]         = useState('')
  const [filterGenre, setFilterGenre]       = useState('')

  const [modalRapide,  setModalRapide]  = useState(false)
  const [modalComplet, setModalComplet] = useState(false)
  const [formRapide,   setFormRapide]   = useState(emptyRapide)
  const [formComplet,  setFormComplet]  = useState(emptyComplet)
  const [editing,      setEditing]      = useState(null)
  const [saving,       setSaving]       = useState(false)
  const [confirm,      setConfirm]      = useState(null)
  const [detailModal,  setDetailModal]  = useState(null)

  const load = (p = page, pp = perPage) => {
    setLoading(true)
    const params = { page: p, per_page: pp }
    if (filterDep)   params.IDgen_mst_Departement = filterDep
    if (filterType)  params.staff_type = filterType
    if (filterGenre) params.gender_id  = filterGenre
    if (search)      params.search     = search

    Promise.all([
      personnelApi.liste(params),
      departementApi.liste(),
    ]).then(([res, d]) => {
      const result = res.data.data
      setData(result?.data || [])
      setPaginationMeta(result?.last_page ? result : null)
      const toArray = (v) => Array.isArray(v) ? v : (v?.data ?? [])
      setDeps(toArray(d.data.data))
    }).finally(() => setLoading(false))
  }

  useEffect(() => { setPage(1); load(1, perPage) }, [filterDep, filterType, filterGenre, search])

  const depOptions = departements.map(d => ({ value: String(d.IDgen_mst_Departement), label: d.NomDepartement }))
  const hasFilters = filterDep || filterType || filterGenre || search
  const resetFilters = () => { setFilterDep(''); setFilterType(''); setFilterGenre(''); setSearch('') }

  // ── Handlers Rapide ──
  const openCreateRapide = () => { setEditing(null); setFormRapide(emptyRapide); setModalRapide(true) }
  const closeRapide      = () => { setModalRapide(false); setEditing(null) }
  const changeRapide     = e => setFormRapide(f => ({ ...f, [e.target.name]: e.target.value }))

  const submitRapide = async e => {
    e.preventDefault(); setSaving(true)
    try {
      await personnelApi.creerRapide(formRapide)
      showToast('Personnel créé rapidement.')
      closeRapide(); load()
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(' ')
        : 'Erreur.'
      showToast(msg, 'error')
    } finally { setSaving(false) }
  }

  // ── Handlers Complet ──
  const openCreateComplet = () => { setEditing(null); setFormComplet(emptyComplet); setModalComplet(true) }
  const openEditComplet   = (row) => {
    setEditing(row)
    setFormComplet({ ...emptyComplet, ...row, IDgen_mst_Departement: String(row.IDgen_mst_Departement || '') })
    setModalComplet(true)
  }
  const closeComplet  = () => { setModalComplet(false); setEditing(null) }
  const changeComplet = e => setFormComplet(f => ({ ...f, [e.target.name]: e.target.value }))

  const submitComplet = async e => {
    e.preventDefault(); setSaving(true)
    try {
      if (editing) {
        await personnelApi.modifier(editing.id, formComplet)
        showToast('Dossier mis à jour.')
      } else {
        await personnelApi.creer(formComplet)
        showToast('Dossier créé.')
      }
      closeComplet(); load()
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(' ')
        : 'Erreur.'
      showToast(msg, 'error')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await personnelApi.supprimer(confirm.id)
      showToast('Personnel supprimé.'); setConfirm(null); load()
    } catch { showToast('Erreur lors de la suppression.', 'error') }
  }

  // ── Stats ──
  const total   = paginationMeta?.total ?? data.length
  const stats = [
    { label: 'Total',         value: total,                                                      icon: '👥', color: colors.bleu,   bg: colors.infoBg    },
    { label: 'Médecins',      value: data.filter(d => d.staff_type === 'medecin').length,         icon: '🩺', color: '#2e7d32',     bg: colors.successBg },
    { label: 'Infirmier(e)s', value: data.filter(d => d.staff_type === 'infirmier').length,       icon: '💉', color: colors.orange, bg: colors.orangeLight },
    { label: 'Administratifs',value: data.filter(d => d.staff_type === 'administratif').length,   icon: '📋', color: '#6a1b9a',     bg: '#f3e5f5'        },
  ]

  return (
    <div style={{ background: colors.gray50, minHeight: '100vh', paddingBottom: 40 }}>

      {/* ── Header gradient ── */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.bleu} 0%, #1565c0 100%)`,
        padding: '28px 32px 32px',
        marginBottom: 28,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 50, height: 50, borderRadius: radius.md,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
            }}>👥</div>
            <div>
              <h1 style={{ color: colors.white, margin: 0, fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>
                Gestion du Personnel
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.65)', margin: '4px 0 0', fontSize: 13 }}>
                Médecins · Infirmiers · Techniciens · Administratifs
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={openCreateRapide}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', borderRadius: radius.sm,
                border: '1.5px solid rgba(255,255,255,0.4)',
                background: 'rgba(255,255,255,0.1)', color: colors.white,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              ⚡ Création rapide
            </button>
            <button
              onClick={openCreateComplet}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', borderRadius: radius.sm,
                border: 'none', background: colors.orange, color: colors.white,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(255,118,49,0.4)',
              }}
            >
              ➕ Dossier complet
            </button>
          </div>
        </div>

        {/* Stats dans le header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 24 }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.12)',
              borderRadius: radius.md, padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: radius.sm,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
              }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: colors.white, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 3 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 24px' }}>

        {/* ── Barre de filtres ── */}
        <div style={{
          background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm,
          padding: '14px 18px', display: 'flex', alignItems: 'center',
          gap: 10, marginBottom: 20, flexWrap: 'wrap',
        }}>
          {/* Recherche */}
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <span style={{
              position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
              color: colors.gray400, fontSize: 14, pointerEvents: 'none',
            }}>🔍</span>
            <input
              placeholder="Rechercher par nom, spécialisation..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', paddingLeft: 34, paddingRight: 12,
                height: 36, border: `1.5px solid ${colors.gray200}`,
                borderRadius: radius.sm, fontSize: 13, color: colors.gray700,
                outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => { e.target.style.borderColor = colors.bleu }}
              onBlur={e => { e.target.style.borderColor = colors.gray200 }}
            />
          </div>

          <Select
            name="filterDep" value={filterDep}
            onChange={e => setFilterDep(e.target.value)}
            options={depOptions} placeholder="Département"
            style={{ minWidth: 170, marginBottom: 0 }}
          />
          <Select
            name="filterType" value={filterType}
            onChange={e => setFilterType(e.target.value)}
            options={STAFF_TYPES} placeholder="Fonction"
            style={{ minWidth: 155, marginBottom: 0 }}
          />
          <Select
            name="filterGenre" value={filterGenre}
            onChange={e => setFilterGenre(e.target.value)}
            options={GENRES} placeholder="Genre"
            style={{ minWidth: 130, marginBottom: 0 }}
          />

          {hasFilters && (
            <button
              onClick={resetFilters}
              style={{
                padding: '6px 12px', borderRadius: radius.sm,
                border: `1px solid ${colors.gray200}`, background: colors.dangerBg,
                color: colors.danger, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              ✕ Réinitialiser
            </button>
          )}

          <div style={{ marginLeft: 'auto', fontSize: 12, color: colors.gray500, whiteSpace: 'nowrap' }}>
            <strong style={{ color: colors.bleu }}>{total}</strong> personnel(s)
          </div>
        </div>

        {/* ── Grille de cartes ── */}
        {loading ? <FullPageSpinner /> : (
          <>
            {data.length === 0 ? (
              <div style={{
                background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm,
                textAlign: 'center', padding: '64px 24px',
              }}>
                <div style={{ fontSize: 52, marginBottom: 14 }}>👤</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: colors.gray700 }}>Aucun personnel trouvé</div>
                <div style={{ fontSize: 13, color: colors.gray400, marginTop: 6, marginBottom: 20 }}>
                  {hasFilters ? 'Modifiez vos filtres pour voir plus de résultats.' : 'Ajoutez votre premier membre du personnel.'}
                </div>
                {hasFilters
                  ? <Button variant="ghost" onClick={resetFilters}>Réinitialiser les filtres</Button>
                  : <Button onClick={openCreateComplet} icon="➕">Nouveau dossier</Button>
                }
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                gap: 16, marginBottom: 20,
              }}>
                {data.map(row => (
                  <PersonnelCard
                    key={row.id}
                    row={row}
                    onView={() => setDetailModal(row)}
                    onEdit={() => openEditComplet(row)}
                    onDelete={() => setConfirm(row)}
                  />
                ))}
              </div>
            )}

            {/* ── Pagination ── */}
            <div style={{ background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm }}>
              <Pagination
                meta={paginationMeta}
                onPageChange={p => { setPage(p); load(p, perPage) }}
                onPerPageChange={pp => { setPerPage(pp); setPage(1); load(1, pp) }}
              />
            </div>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════
          MODAL — Création rapide
      ══════════════════════════════════════════════════ */}
      <Modal
        open={modalRapide} onClose={closeRapide}
        title="⚡ Création rapide"
        width={520}
        footer={
          <>
            <Button variant="ghost" onClick={closeRapide}>Annuler</Button>
            <Button onClick={submitRapide} disabled={saving} variant="success">
              {saving ? 'Enregistrement...' : '⚡ Créer'}
            </Button>
          </>
        }
      >
        <div style={{
          background: colors.orangeLight, borderRadius: radius.sm,
          padding: '10px 14px', marginBottom: 20,
          fontSize: 13, color: colors.orange, fontWeight: 500,
        }}>
          Saisissez les informations essentielles. Vous pourrez compléter le dossier ultérieurement.
        </div>
        <form onSubmit={submitRapide}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="Prénom"    name="first_name"   value={formRapide.first_name}   onChange={changeRapide} required />
            <Input label="Nom"       name="last_name"    value={formRapide.last_name}    onChange={changeRapide} required />
            <Select label="Genre"    name="gender_id"    value={formRapide.gender_id}    onChange={changeRapide} required options={GENRES} placeholder="Sélectionner" />
            <Select label="Fonction" name="staff_type"   value={formRapide.staff_type}   onChange={changeRapide} required options={STAFF_TYPES} placeholder="Sélectionner" />
            <Input label="Contact"   name="contact_number" value={formRapide.contact_number} onChange={changeRapide} required placeholder="Téléphone" />
            <Select label="Département" name="IDgen_mst_Departement" value={formRapide.IDgen_mst_Departement} onChange={changeRapide} required options={depOptions} placeholder="Sélectionner" />
          </div>
        </form>
      </Modal>

      {/* ══════════════════════════════════════════════════
          MODAL — Dossier complet
      ══════════════════════════════════════════════════ */}
      <Modal
        open={modalComplet} onClose={closeComplet}
        title={editing ? '✏️ Modifier le dossier' : '➕ Nouveau dossier complet'}
        width={800}
        footer={
          <>
            <Button variant="ghost" onClick={closeComplet}>Annuler</Button>
            <Button onClick={submitComplet} disabled={saving}>
              {saving ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Créer le dossier'}
            </Button>
          </>
        }
      >
        <form onSubmit={submitComplet}>
          <div style={{ marginBottom: 20 }}>
            <Section title="Identité" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <Input label="Prénom"          name="first_name"    value={formComplet.first_name}    onChange={changeComplet} required />
              <Input label="Nom"             name="last_name"     value={formComplet.last_name}     onChange={changeComplet} required />
              <Input label="2ème prénom"     name="second_name"   value={formComplet.second_name}   onChange={changeComplet} />
              <Select label="Genre"          name="gender_id"     value={formComplet.gender_id}     onChange={changeComplet} required options={GENRES} placeholder="Sélectionner" />
              <Select label="Titre"          name="titre_id"      value={formComplet.titre_id}      onChange={changeComplet}
                options={[{ value: 'Dr', label: 'Dr' }, { value: 'Pr', label: 'Pr' }, { value: 'M', label: 'M.' }, { value: 'Mme', label: 'Mme' }]}
              />
              <Select label="Groupe sanguin" name="groupe_sanguin" value={formComplet.groupe_sanguin} onChange={changeComplet} options={GROUPES_SANGUINS} />
              <Input label="Date de naissance" name="date_of_birth" value={formComplet.date_of_birth} onChange={changeComplet} type="date" />
              <Input label="Nationalité"     name="nationality_id" value={formComplet.nationality_id} onChange={changeComplet} />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <Section title="Informations professionnelles" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Select label="Fonction"        name="staff_type"    value={formComplet.staff_type}    onChange={changeComplet} required options={STAFF_TYPES} />
              <Input  label="Spécialisation"  name="specialization" value={formComplet.specialization} onChange={changeComplet} />
              <Select label="Département"     name="IDgen_mst_Departement" value={String(formComplet.IDgen_mst_Departement)} onChange={changeComplet} required options={depOptions} />
              <Input  label="ID Professionnel" name="ID_pro"        value={formComplet.ID_pro}        onChange={changeComplet} />
              <Select label="Type d'exercice" name="type_exercie"   value={formComplet.type_exercie}  onChange={changeComplet}
                options={[{ value: 'liberal', label: 'Libéral' }, { value: 'salarie', label: 'Salarié' }, { value: 'benevole', label: 'Bénévole' }]}
              />
              <Input  label="Secteur"         name="secteur"        value={formComplet.secteur}       onChange={changeComplet} />
              <Input  label="Lieu d'exercice" name="lieu_exercice"  value={formComplet.lieu_exercice} onChange={changeComplet} />
              <Input  label="Date d'entrée"   name="Joining_date"   value={formComplet.Joining_date}  onChange={changeComplet} type="date" />
              <Input  label="Fin de service"  name="End_of_service_date" value={formComplet.End_of_service_date} onChange={changeComplet} type="date" />
              <Select label="Statut"          name="status_id"      value={String(formComplet.status_id)} onChange={changeComplet}
                options={[{ value: '1', label: 'Actif' }, { value: '0', label: 'Inactif' }]}
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <Section title="Contacts" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Input label="Téléphone principal"  name="contact_number" value={formComplet.contact_number} onChange={changeComplet} required />
              <Input label="Téléphone secondaire" name="phone_number"   value={formComplet.phone_number}   onChange={changeComplet} />
              <Input label="Email personnel"      name="email_adress"   value={formComplet.email_adress}   onChange={changeComplet} type="email" />
              <Input label="Email professionnel"  name="email_pro"      value={formComplet.email_pro}      onChange={changeComplet} type="email" />
            </div>
          </div>

          <div>
            <Section title="Adresse" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Input label="Adresse principale" name="address"         value={formComplet.address}         onChange={changeComplet} style={{ gridColumn: '1/-1' }} />
              <Input label="Autre adresse"      name="autre_adress"    value={formComplet.autre_adress}    onChange={changeComplet} />
              <Input label="Ville"              name="city"            value={formComplet.city}            onChange={changeComplet} />
              <Input label="Code postal"        name="code_postal"     value={formComplet.code_postal}     onChange={changeComplet} />
              <Input label="Ville principale"   name="ville_principal" value={formComplet.ville_principal} onChange={changeComplet} />
              <Input label="Ville secondaire"   name="ville_secondaire" value={formComplet.ville_secondaire} onChange={changeComplet} />
              <Input label="Pays"               name="country_id"      value={formComplet.country_id}      onChange={changeComplet} />
              <Select label="Type d'adresse"    name="type_adresse"    value={formComplet.type_adresse}    onChange={changeComplet}
                options={[{ value: 'domicile', label: 'Domicile' }, { value: 'travail', label: 'Travail' }, { value: 'autre', label: 'Autre' }]}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* ══════════════════════════════════════════════════
          MODAL — Détail dossier
      ══════════════════════════════════════════════════ */}
      <Modal
        open={!!detailModal} onClose={() => setDetailModal(null)}
        title={`👤 ${detailModal?.staff_name}`}
        width={580}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDetailModal(null)}>Fermer</Button>
            <Button onClick={() => { openEditComplet(detailModal); setDetailModal(null) }}>✏️ Modifier</Button>
          </>
        }
      >
        {detailModal && (() => {
          const cfg = TYPE_CONFIG[detailModal.staff_type] || TYPE_CONFIG.autre
          const isFemme = detailModal.gender_id === 'feminin'
          return (
            <div>
              {/* Carte identité */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '16px 20px', borderRadius: radius.md, marginBottom: 20,
                background: `linear-gradient(135deg, ${colors.bleu}08, ${colors.bleu}18)`,
                border: `1px solid ${colors.bleu}22`,
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
                  background: isFemme ? '#fce4ec' : `${colors.bleu}18`,
                  color: isFemme ? '#e91e63' : colors.bleu,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 24,
                  border: `3px solid ${isFemme ? '#f48fb1' : colors.bleu + '33'}`,
                }}>
                  {(detailModal.first_name?.[0] || '') + (detailModal.last_name?.[0] || '')}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: colors.bleu }}>{detailModal.staff_name}</div>
                  <div style={{ fontSize: 12, color: colors.gray500, marginTop: 3 }}>
                    ID #{detailModal.user_id}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: cfg.bg, color: cfg.color,
                      borderRadius: radius.full, padding: '3px 10px', fontSize: 11, fontWeight: 600,
                    }}>
                      {cfg.icon} {cfg.label}
                    </span>
                    <StatusBadge status={detailModal.status_id} />
                  </div>
                </div>
              </div>

              {/* Infos détaillées */}
              {[
                { label: 'Département',      value: detailModal.departement?.NomDepartement, icon: '🏥' },
                { label: 'Spécialisation',   value: detailModal.specialization,              icon: '🎓' },
                { label: 'Téléphone',        value: detailModal.contact_number,              icon: '📞' },
                { label: 'Email',            value: detailModal.email_adress,                icon: '📧' },
                { label: 'Email pro',        value: detailModal.email_pro,                   icon: '📧' },
                { label: 'Date de naissance',value: detailModal.date_of_birth,               icon: '🎂' },
                { label: 'Groupe sanguin',   value: detailModal.groupe_sanguin,              icon: '🩸' },
                { label: 'Date d\'entrée',   value: detailModal.Joining_date,                icon: '📅' },
                { label: 'Adresse',          value: detailModal.address,                     icon: '📍' },
                { label: 'Ville',            value: detailModal.city,                        icon: '🌆' },
                { label: 'Pays',             value: detailModal.country_id,                  icon: '🌍' },
              ].filter(r => r.value).map((row, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0', borderBottom: `1px solid ${colors.gray100}`,
                  fontSize: 13,
                }}>
                  <span style={{ fontSize: 16, width: 24, textAlign: 'center', flexShrink: 0 }}>{row.icon}</span>
                  <span style={{ color: colors.gray500, minWidth: 130, fontWeight: 500 }}>{row.label}</span>
                  <span style={{ color: colors.gray900, fontWeight: 600 }}>{row.value}</span>
                </div>
              ))}
            </div>
          )
        })()}
      </Modal>

      <ConfirmDialog
        open={!!confirm} onCancel={() => setConfirm(null)} onConfirm={handleDelete}
        message={`Supprimer le dossier de "${confirm?.staff_name}" ? Cette action est irréversible.`}
      />
    </div>
  )
}
