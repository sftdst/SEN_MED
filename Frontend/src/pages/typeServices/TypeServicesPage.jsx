import { useEffect, useState } from 'react'
import { typeServiceApi, departementApi } from '../../api'
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

const emptyForm = { NomType: '', description: '', status: 1, IDgen_mst_Departement: '' }

export default function TypeServicesPage() {
  const [data, setData]             = useState([])
  const [departements, setDeps]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [filterDep, setFilterDep]   = useState('')
  const [modal, setModal]           = useState(false)
  const [editing, setEditing]       = useState(null)
  const [form, setForm]             = useState(emptyForm)
  const [saving, setSaving]         = useState(false)
  const [confirm, setConfirm]       = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      typeServiceApi.liste(filterDep ? { IDgen_mst_Departement: filterDep } : {}),
      departementApi.liste(),
    ]).then(([t, d]) => {
      setData(t.data.data || [])
      setDeps(d.data.data || [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filterDep])

  const filtered = data.filter(t =>
    (t.NomType || '').toLowerCase().includes(search.toLowerCase())
  )

  const depOptions = departements.map(d => ({ value: String(d.IDgen_mst_Departement), label: d.NomDepartement }))

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModal(true) }
  const openEdit   = (row) => { setEditing(row); setForm({ ...emptyForm, ...row }); setModal(true) }
  const closeModal = () => { setModal(false); setEditing(null) }
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true)
    try {
      if (editing) {
        await typeServiceApi.modifier(editing.IDgen_mst_Type_Service, form)
        showToast('Type de service mis à jour.')
      } else {
        await typeServiceApi.creer(form)
        showToast('Type de service créé.')
      }
      closeModal(); load()
    } catch (err) {
      const errors = err.response?.data?.errors
      const msg = errors ? Object.values(errors).flat().join(' ') : 'Erreur.'
      showToast(msg, 'error')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await typeServiceApi.supprimer(confirm.IDgen_mst_Type_Service)
      showToast('Type de service supprimé.'); setConfirm(null); load()
    } catch { showToast('Erreur lors de la suppression.', 'error') }
  }

  const columns = [
    { key: 'NomType', title: 'Type de service', render: (v, row) => (
      <div>
        <div style={{ fontWeight: 600, color: colors.bleu }}>{v}</div>
        <div style={{ fontSize: 12, color: colors.gray500 }}>{row.description}</div>
      </div>
    )},
    { key: 'departement', title: 'Département', render: (_, row) => row.departement?.NomDepartement || '—' },
    { key: 'services',    title: 'Services', align: 'center',
      render: (_, row) => (
        <span style={{ fontWeight: 700, color: colors.orange }}>{row.services?.length ?? 0}</span>
      )
    },
    { key: 'status', title: 'Statut', align: 'center', render: v => <StatusBadge status={v} /> },
    { key: 'IDgen_mst_Type_Service', title: 'Actions', align: 'center', width: 130,
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
        title="Types de Service"
        subtitle="Catégories de soins par département"
        actions={<Button onClick={openCreate} icon="➕">Nouveau type</Button>}
      />

      <div style={{
        background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm,
        padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap',
      }}>
        <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200, marginBottom: 0 }} />
        <Select name="filterDep" value={filterDep} onChange={e => setFilterDep(e.target.value)}
          options={depOptions} placeholder="Tous les départements" style={{ minWidth: 220, marginBottom: 0 }}
        />
        <div style={{ color: colors.gray500, fontSize: 13 }}>{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</div>
      </div>

      <div style={{ background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm, overflow: 'hidden' }}>
        {loading ? <FullPageSpinner /> : <Table columns={columns} data={filtered} emptyText="Aucun type de service enregistré." />}
      </div>

      <Modal
        open={modal} onClose={closeModal}
        title={editing ? '✏️ Modifier le type de service' : '➕ Nouveau type de service'}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Créer'}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="Nom du type" name="NomType" value={form.NomType} onChange={handleChange} required placeholder="Ex: Consultation, Chirurgie..." />
            <Input label="Description" name="description" value={form.description} onChange={handleChange} required />
            <Select label="Département" name="IDgen_mst_Departement" value={String(form.IDgen_mst_Departement)} onChange={handleChange} required options={depOptions} placeholder="Sélectionner un département" />
            <Select label="Statut" name="status" value={String(form.status)} onChange={handleChange}
              options={[{ value: '1', label: 'Actif' }, { value: '0', label: 'Inactif' }]}
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirm} onCancel={() => setConfirm(null)} onConfirm={handleDelete}
        message={`Supprimer le type de service "${confirm?.NomType}" ?`}
      />
    </div>
  )
}
