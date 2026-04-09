import { useEffect, useState } from 'react'
import { departementApi, hospitalApi } from '../../api'
import { colors, radius, shadows } from '../../theme'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import Table from '../../components/ui/Table'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import PageHeader from '../../components/ui/PageHeader'
import { StatusBadge } from '../../components/ui/Badge'
import { showToast } from '../../components/ui/Toast'
import { FullPageSpinner } from '../../components/ui/Spinner'

const emptyForm = { NomDepartement: '', description: '', status: 1, Hospital_id: '' }

export default function DepartementsPage() {
  const [data, setData]           = useState([])
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterHospital, setFilterHospital] = useState('')
  const [modal, setModal]         = useState(false)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState(emptyForm)
  const [saving, setSaving]       = useState(false)
  const [confirm, setConfirm]     = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      departementApi.liste(filterHospital ? { Hospital_id: filterHospital } : {}),
      hospitalApi.liste(),
    ]).then(([d, h]) => {
      setData(d.data.data || [])
      setHospitals(h.data.data || [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filterHospital])

  const filtered = data.filter(d =>
    (d.NomDepartement || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.description || '').toLowerCase().includes(search.toLowerCase())
  )

  const hospitalOptions = hospitals.map(h => ({ value: String(h.Hospital_id), label: h.hospital_name }))

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModal(true) }
  const openEdit   = (row) => { setEditing(row); setForm({ ...emptyForm, ...row }); setModal(true) }
  const closeModal = () => { setModal(false); setEditing(null) }

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true)
    try {
      if (editing) {
        await departementApi.modifier(editing.IDgen_mst_Departement, form)
        showToast('Département mis à jour avec succès.')
      } else {
        await departementApi.creer(form)
        showToast('Département créé avec succès.')
      }
      closeModal(); load()
    } catch (err) {
      const errors = err.response?.data?.errors
      const msg = errors ? Object.values(errors).flat().join(' ') : 'Une erreur est survenue.'
      showToast(msg, 'error')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await departementApi.supprimer(confirm.IDgen_mst_Departement)
      showToast('Département supprimé.'); setConfirm(null); load()
    } catch { showToast('Erreur lors de la suppression.', 'error') }
  }

  const columns = [
    { key: 'NomDepartement', title: 'Nom du département', render: (v, row) => (
      <div>
        <div style={{ fontWeight: 600, color: colors.bleu }}>{v}</div>
        <div style={{ fontSize: 12, color: colors.gray500, marginTop: 2 }}>{row.description}</div>
      </div>
    )},
    { key: 'hospital', title: 'Hôpital', render: (_, row) => (
      <span style={{ color: colors.gray700 }}>{row.hospital?.hospital_name || '—'}</span>
    )},
    { key: 'status', title: 'Statut', align: 'center', render: v => <StatusBadge status={v} /> },
    { key: 'IDgen_mst_Departement', title: 'Actions', align: 'center', width: 120,
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>✏️ Modifier</Button>
          <Button size="sm" variant="danger"    onClick={() => setConfirm(row)}>🗑️</Button>
        </div>
      )
    },
  ]

  return (
    <div>
      <PageHeader
        title="Gestion des Départements"
        subtitle="Structurez vos services par département"
        actions={<Button onClick={openCreate} icon="➕">Nouveau département</Button>}
      />

      <div style={{
        background: colors.white, borderRadius: radius.md,
        boxShadow: shadows.sm, padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap',
      }}>
        <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200, marginBottom: 0 }} />
        <Select
          name="filterHospital" value={filterHospital}
          onChange={e => setFilterHospital(e.target.value)}
          options={hospitalOptions} placeholder="Tous les hôpitaux"
          style={{ minWidth: 220, marginBottom: 0 }}
        />
        <div style={{ color: colors.gray500, fontSize: 13 }}>{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</div>
      </div>

      <div style={{ background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm, overflow: 'hidden' }}>
        {loading ? <FullPageSpinner /> : <Table columns={columns} data={filtered} emptyText="Aucun département enregistré." />}
      </div>

      <Modal
        open={modal} onClose={closeModal}
        title={editing ? '✏️ Modifier le département' : '➕ Nouveau département'}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Créer'}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="Nom du département" name="NomDepartement" value={form.NomDepartement} onChange={handleChange} required />
            <Input label="Description"        name="description"    value={form.description}    onChange={handleChange} required />
            <Select label="Hôpital"           name="Hospital_id"    value={String(form.Hospital_id)} onChange={handleChange} required options={hospitalOptions} placeholder="Sélectionner un hôpital" />
            <Select label="Statut"            name="status"         value={String(form.status)}  onChange={handleChange}
              options={[{ value: '1', label: 'Actif' }, { value: '0', label: 'Inactif' }]}
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirm} onCancel={() => setConfirm(null)} onConfirm={handleDelete}
        message={`Supprimer le département "${confirm?.NomDepartement}" ?`}
      />
    </div>
  )
}
