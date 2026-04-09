import { useEffect, useState } from 'react'
import { personnelApi, departementApi } from '../../api'
import { colors, radius, shadows } from '../../theme'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import Table from '../../components/ui/Table'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import PageHeader from '../../components/ui/PageHeader'
import Badge, { StatusBadge } from '../../components/ui/Badge'
import { showToast } from '../../components/ui/Toast'
import { FullPageSpinner } from '../../components/ui/Spinner'

// ── Formulaire rapide (6 champs) ──────────────────────────
const emptyRapide = { first_name: '', last_name: '', gender_id: '', staff_type: '', contact_number: '', IDgen_mst_Departement: '' }

// ── Formulaire complet (tous les champs) ──────────────────
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

// ── Section label helper ──────────────────────────────────
function Section({ title }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, color: colors.orange, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, paddingBottom: 6, borderBottom: `2px solid ${colors.orangeLight}` }}>
      {title}
    </div>
  )
}

export default function PersonnelsPage() {
  const [data, setData]             = useState([])
  const [meta, setMeta]             = useState(null)
  const [departements, setDeps]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [filterDep, setFilterDep]   = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterGenre, setFilterGenre] = useState('')

  // Modals
  const [modalRapide,  setModalRapide]  = useState(false)
  const [modalComplet, setModalComplet] = useState(false)
  const [formRapide,   setFormRapide]   = useState(emptyRapide)
  const [formComplet,  setFormComplet]  = useState(emptyComplet)
  const [editing,      setEditing]      = useState(null)
  const [saving,       setSaving]       = useState(false)
  const [confirm,      setConfirm]      = useState(null)
  const [detailModal,  setDetailModal]  = useState(null)

  const load = () => {
    setLoading(true)
    const params = {}
    if (filterDep)   params.IDgen_mst_Departement = filterDep
    if (filterType)  params.staff_type = filterType
    if (filterGenre) params.gender_id  = filterGenre
    if (search)      params.search     = search

    Promise.all([
      personnelApi.liste(params),
      personnelApi.metadata(),
      departementApi.liste(),
    ]).then(([p, m, d]) => {
      setData(p.data.data?.data || p.data.data || [])
      setMeta(m.data.data)
      setDeps(d.data.data || [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filterDep, filterType, filterGenre])

  const depOptions = departements.map(d => ({ value: String(d.IDgen_mst_Departement), label: d.NomDepartement }))

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
      const errors = err.response?.data?.errors
      const msg = errors ? Object.values(errors).flat().join(' ') : 'Erreur.'
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
        showToast('Dossier personnel mis à jour.')
      } else {
        await personnelApi.creer(formComplet)
        showToast('Dossier personnel créé.')
      }
      closeComplet(); load()
    } catch (err) {
      const errors = err.response?.data?.errors
      const msg = errors ? Object.values(errors).flat().join(' ') : 'Erreur.'
      showToast(msg, 'error')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await personnelApi.supprimer(confirm.id)
      showToast('Personnel supprimé.'); setConfirm(null); load()
    } catch { showToast('Erreur lors de la suppression.', 'error') }
  }

  // ── Columns ──
  const columns = [
    { key: 'staff_name', title: 'Nom complet', render: (v, row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: row.gender_id === 'feminin' ? '#e91e6322' : `${colors.bleu}22`,
          color: row.gender_id === 'feminin' ? '#e91e63' : colors.bleu,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 15, flexShrink: 0,
        }}>
          {(row.first_name?.[0] || '') + (row.last_name?.[0] || '')}
        </div>
        <div>
          <div style={{ fontWeight: 700, color: colors.bleu }}>{v}</div>
          <div style={{ fontSize: 12, color: colors.gray500 }}>ID: {row.user_id}</div>
        </div>
      </div>
    )},
    { key: 'staff_type', title: 'Fonction', render: v => (
      <Badge variant="info">{STAFF_TYPES.find(s => s.value === v)?.label || v || '—'}</Badge>
    )},
    { key: 'gender_id', title: 'Genre', render: v => (
      <Badge variant={v === 'feminin' ? 'orange' : 'info'}>
        {v === 'feminin' ? '♀ Féminin' : v === 'masculin' ? '♂ Masculin' : '—'}
      </Badge>
    )},
    { key: 'departement', title: 'Département', render: (_, row) => row.departement?.NomDepartement || '—' },
    { key: 'contact_number', title: 'Contact' },
    { key: 'status_id', title: 'Statut', align: 'center', render: v => <StatusBadge status={v} /> },
    { key: 'id', title: 'Actions', align: 'center', width: 160,
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button size="sm" variant="ghost"      onClick={() => setDetailModal(row)}>👁️</Button>
          <Button size="sm" variant="secondary"  onClick={() => openEditComplet(row)}>✏️</Button>
          <Button size="sm" variant="danger"     onClick={() => setConfirm(row)}>🗑️</Button>
        </div>
      )
    },
  ]

  return (
    <div>
      <PageHeader
        title="Gestion du Personnel"
        subtitle="Médecins, infirmiers, techniciens et administratifs"
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" onClick={openCreateRapide} icon="⚡">Création rapide</Button>
            <Button onClick={openCreateComplet} icon="➕">Dossier complet</Button>
          </div>
        }
      />

      {/* Filtres */}
      <div style={{
        background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm,
        padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, flexWrap: 'wrap',
      }}>
        <Input
          placeholder="Rechercher un personnel..."
          value={search}
          onChange={e => { setSearch(e.target.value); load() }}
          style={{ flex: 1, minWidth: 200, marginBottom: 0 }}
        />
        <Select name="filterDep" value={filterDep} onChange={e => setFilterDep(e.target.value)}
          options={depOptions} placeholder="Tous les départements" style={{ minWidth: 200, marginBottom: 0 }}
        />
        <Select name="filterType" value={filterType} onChange={e => setFilterType(e.target.value)}
          options={STAFF_TYPES} placeholder="Toutes les fonctions" style={{ minWidth: 180, marginBottom: 0 }}
        />
        <Select name="filterGenre" value={filterGenre} onChange={e => setFilterGenre(e.target.value)}
          options={GENRES} placeholder="Tous les genres" style={{ minWidth: 150, marginBottom: 0 }}
        />
        <div style={{ color: colors.gray500, fontSize: 13 }}>
          {Array.isArray(data) ? data.length : 0} personnel(s)
        </div>
      </div>

      {/* Table */}
      <div style={{ background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm, overflow: 'hidden' }}>
        {loading ? <FullPageSpinner /> : (
          <Table columns={columns} data={Array.isArray(data) ? data : []} emptyText="Aucun personnel enregistré." />
        )}
      </div>

      {/* ── Modal Création Rapide ── */}
      <Modal
        open={modalRapide} onClose={closeRapide}
        title="⚡ Création rapide du personnel"
        width={520}
        footer={
          <>
            <Button variant="ghost" onClick={closeRapide}>Annuler</Button>
            <Button onClick={submitRapide} disabled={saving} variant="success">
              {saving ? 'Enregistrement...' : '⚡ Créer rapidement'}
            </Button>
          </>
        }
      >
        <div style={{ background: colors.orangeLight, borderRadius: radius.sm, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: colors.orange, fontWeight: 500 }}>
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

      {/* ── Modal Dossier Complet ── */}
      <Modal
        open={modalComplet} onClose={closeComplet}
        title={editing ? '✏️ Modifier le dossier personnel' : '➕ Nouveau dossier personnel complet'}
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
          {/* Identité */}
          <div style={{ marginBottom: 20 }}>
            <Section title="Identité" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <Input label="Prénom"        name="first_name"   value={formComplet.first_name}   onChange={changeComplet} required />
              <Input label="Nom"           name="last_name"    value={formComplet.last_name}    onChange={changeComplet} required />
              <Input label="2ème prénom"   name="second_name"  value={formComplet.second_name}  onChange={changeComplet} />
              <Select label="Genre"        name="gender_id"    value={formComplet.gender_id}    onChange={changeComplet} required options={GENRES} placeholder="Sélectionner" />
              <Select label="Titre"        name="titre_id"     value={formComplet.titre_id}     onChange={changeComplet}
                options={[{ value: 'Dr', label: 'Dr' }, { value: 'Pr', label: 'Pr' }, { value: 'M', label: 'M.' }, { value: 'Mme', label: 'Mme' }]}
              />
              <Select label="Groupe sanguin" name="groupe_sanguin" value={formComplet.groupe_sanguin} onChange={changeComplet} options={GROUPES_SANGUINS} />
              <Input label="Date de naissance" name="date_of_birth" value={formComplet.date_of_birth} onChange={changeComplet} type="date" />
              <Input label="Nationalité"   name="nationality_id" value={formComplet.nationality_id} onChange={changeComplet} />
            </div>
          </div>

          {/* Informations professionnelles */}
          <div style={{ marginBottom: 20 }}>
            <Section title="Informations professionnelles" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Select label="Fonction"       name="staff_type"      value={formComplet.staff_type}      onChange={changeComplet} required options={STAFF_TYPES} />
              <Input  label="Spécialisation" name="specialization"  value={formComplet.specialization}  onChange={changeComplet} />
              <Select label="Département"    name="IDgen_mst_Departement" value={String(formComplet.IDgen_mst_Departement)} onChange={changeComplet} required options={depOptions} />
              <Input  label="ID Professionnel" name="ID_pro"        value={formComplet.ID_pro}          onChange={changeComplet} />
              <Select label="Type d'exercice" name="type_exercie"   value={formComplet.type_exercie}    onChange={changeComplet}
                options={[{ value: 'liberal', label: 'Libéral' }, { value: 'salarie', label: 'Salarié' }, { value: 'benevole', label: 'Bénévole' }]}
              />
              <Input  label="Secteur"        name="secteur"         value={formComplet.secteur}         onChange={changeComplet} />
              <Input  label="Lieu d'exercice" name="lieu_exercice"  value={formComplet.lieu_exercice}   onChange={changeComplet} />
              <Input  label="Date d'entrée"  name="Joining_date"    value={formComplet.Joining_date}    onChange={changeComplet} type="date" />
              <Input  label="Date de fin de service" name="End_of_service_date" value={formComplet.End_of_service_date} onChange={changeComplet} type="date" />
              <Select label="Statut"         name="status_id"       value={String(formComplet.status_id)} onChange={changeComplet}
                options={[{ value: '1', label: 'Actif' }, { value: '0', label: 'Inactif' }]}
              />
            </div>
          </div>

          {/* Contacts */}
          <div style={{ marginBottom: 20 }}>
            <Section title="Contacts" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Input label="Téléphone principal" name="contact_number" value={formComplet.contact_number} onChange={changeComplet} required />
              <Input label="Téléphone secondaire" name="phone_number"  value={formComplet.phone_number}   onChange={changeComplet} />
              <Input label="Email personnel" name="email_adress"       value={formComplet.email_adress}   onChange={changeComplet} type="email" />
              <Input label="Email professionnel" name="email_pro"      value={formComplet.email_pro}      onChange={changeComplet} type="email" />
            </div>
          </div>

          {/* Adresse */}
          <div>
            <Section title="Adresse" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Input label="Adresse principale" name="address"          value={formComplet.address}          onChange={changeComplet} style={{ gridColumn: '1/-1' }} />
              <Input label="Autre adresse"      name="autre_adress"     value={formComplet.autre_adress}     onChange={changeComplet} />
              <Input label="Ville"              name="city"             value={formComplet.city}             onChange={changeComplet} />
              <Input label="Code postal"        name="code_postal"      value={formComplet.code_postal}      onChange={changeComplet} />
              <Input label="Ville principale"   name="ville_principal"  value={formComplet.ville_principal}  onChange={changeComplet} />
              <Input label="Ville secondaire"   name="ville_secondaire" value={formComplet.ville_secondaire} onChange={changeComplet} />
              <Input label="Pays"               name="country_id"       value={formComplet.country_id}       onChange={changeComplet} />
              <Select label="Type d'adresse"    name="type_adresse"     value={formComplet.type_adresse}     onChange={changeComplet}
                options={[{ value: 'domicile', label: 'Domicile' }, { value: 'travail', label: 'Travail' }, { value: 'autre', label: 'Autre' }]}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* ── Modal Détail ── */}
      <Modal
        open={!!detailModal} onClose={() => setDetailModal(null)}
        title={`👤 Dossier — ${detailModal?.staff_name}`}
        width={620}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDetailModal(null)}>Fermer</Button>
            <Button onClick={() => { openEditComplet(detailModal); setDetailModal(null) }}>✏️ Modifier</Button>
          </>
        }
      >
        {detailModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Avatar header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '16px 0 20px', borderBottom: `1px solid ${colors.gray100}`, marginBottom: 16,
            }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: detailModal.gender_id === 'feminin' ? '#fce4ec' : `${colors.bleu}18`,
                color: detailModal.gender_id === 'feminin' ? '#e91e63' : colors.bleu,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 22,
              }}>
                {(detailModal.first_name?.[0] || '') + (detailModal.last_name?.[0] || '')}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, color: colors.bleu }}>{detailModal.staff_name}</div>
                <div style={{ fontSize: 13, color: colors.gray500, marginTop: 2 }}>
                  {STAFF_TYPES.find(s => s.value === detailModal.staff_type)?.label} · ID: {detailModal.user_id}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <StatusBadge status={detailModal.status_id} />
                  <Badge variant={detailModal.gender_id === 'feminin' ? 'orange' : 'info'}>
                    {detailModal.gender_id === 'feminin' ? '♀ Féminin' : '♂ Masculin'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Info grid */}
            {[
              { label: 'Département',    value: detailModal.departement?.NomDepartement },
              { label: 'Spécialisation', value: detailModal.specialization },
              { label: 'Téléphone',      value: detailModal.contact_number },
              { label: 'Email',          value: detailModal.email_adress },
              { label: 'Email pro',      value: detailModal.email_pro },
              { label: 'Date de naissance', value: detailModal.date_of_birth },
              { label: 'Groupe sanguin', value: detailModal.groupe_sanguin },
              { label: 'Date d\'entrée', value: detailModal.Joining_date },
              { label: 'Adresse',        value: detailModal.address },
              { label: 'Ville',          value: detailModal.city },
              { label: 'Pays',           value: detailModal.country_id },
            ].filter(r => r.value).map((row, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, padding: '10px 0',
                borderBottom: `1px solid ${colors.gray100}`,
                fontSize: 14,
              }}>
                <span style={{ color: colors.gray500, minWidth: 140, fontWeight: 500 }}>{row.label}</span>
                <span style={{ color: colors.gray900, fontWeight: 600 }}>{row.value}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm} onCancel={() => setConfirm(null)} onConfirm={handleDelete}
        message={`Supprimer le dossier de "${confirm?.staff_name}" ? Cette action est irréversible.`}
      />
    </div>
  )
}
