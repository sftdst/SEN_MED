import { useEffect, useState } from 'react'
import { hospitalApi } from '../../api'
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

const emptyForm = {
  hospital_name: '', short_name: '', adress: '', postal_code: '',
  zip_code: '', fax: '', mobile_number: '', contact_number: '',
  email_address: '', website: '', status_id: 1, type_cabinet: '',
}

export default function HospitalsPage() {
  const [data, setData]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(emptyForm)
  const [saving, setSaving]     = useState(false)
  const [confirm, setConfirm]   = useState(null)

  const load = () => {
    setLoading(true)
    hospitalApi.liste().then(r => setData(r.data.data || [])).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = data.filter(h =>
    (h.hospital_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (h.short_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModal(true) }
  const openEdit   = (row) => { setEditing(row); setForm({ ...emptyForm, ...row }); setModal(true) }
  const closeModal = () => { setModal(false); setEditing(null) }

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await hospitalApi.modifier(editing.id_Rep, form)
        showToast('Hôpital mis à jour avec succès.')
      } else {
        await hospitalApi.creer(form)
        showToast('Hôpital créé avec succès.')
      }
      closeModal(); load()
    } catch (err) {
      const msg = err.response?.data?.message || 'Une erreur est survenue.'
      showToast(msg, 'error')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await hospitalApi.supprimer(confirm.id_Rep)
      showToast('Hôpital supprimé.', 'success')
      setConfirm(null); load()
    } catch { showToast('Erreur lors de la suppression.', 'error') }
  }

  const columns = [
    { key: 'hospital_name', title: 'Nom de l\'hôpital', render: (v, row) => (
      <div>
        <div style={{ fontWeight: 600, color: colors.bleu }}>{v}</div>
        <div style={{ fontSize: 12, color: colors.gray500 }}>{row.short_name}</div>
      </div>
    )},
    { key: 'type_cabinet',   title: 'Type' },
    { key: 'contact_number', title: 'Contact' },
    { key: 'email_address',  title: 'Email' },
    { key: 'adress',         title: 'Adresse' },
    { key: 'status_id', title: 'Statut', align: 'center',
      render: v => <StatusBadge status={v} />
    },
    { key: 'id_Rep', title: 'Actions', align: 'center', width: 120,
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
        title="Gestion des Hôpitaux"
        subtitle="Organisez vos établissements de santé"
        actions={
          <Button onClick={openCreate} icon="➕">Nouvel hôpital</Button>
        }
      />

      {/* Search & stats bar */}
      <div style={{
        background: colors.white, borderRadius: radius.md,
        boxShadow: shadows.sm, padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20,
      }}>
        <Input
          placeholder="Rechercher un hôpital..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, maxWidth: 340, marginBottom: 0 }}
        />
        <div style={{ marginLeft: 'auto', color: colors.gray500, fontSize: 13 }}>
          {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm, overflow: 'hidden' }}>
        {loading ? <FullPageSpinner /> : <Table columns={columns} data={filtered} emptyText="Aucun hôpital enregistré." />}
      </div>

      {/* Modal Create/Edit */}
      <Modal
        open={modal}
        onClose={closeModal}
        title={editing ? '✏️ Modifier l\'hôpital' : '➕ Nouvel hôpital'}
        width={680}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Créer'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Input label="Nom de l'hôpital" name="hospital_name" value={form.hospital_name} onChange={handleChange} required style={{ gridColumn: '1/-1' }} />
            <Input label="Nom court"        name="short_name"    value={form.short_name}    onChange={handleChange} />
            <Select label="Type de cabinet" name="type_cabinet"  value={form.type_cabinet}  onChange={handleChange}
              options={[
                { value: 'public',   label: 'Public' },
                { value: 'prive',    label: 'Privé' },
                { value: 'clinique', label: 'Clinique' },
                { value: 'cabinet',  label: 'Cabinet' },
              ]}
            />
            <Input label="Adresse"          name="adress"        value={form.adress}        onChange={handleChange} style={{ gridColumn: '1/-1' }} />
            <Input label="Code postal"      name="postal_code"   value={form.postal_code}   onChange={handleChange} />
            <Input label="Code ZIP"         name="zip_code"      value={form.zip_code}      onChange={handleChange} />
            <Input label="Téléphone"        name="contact_number" value={form.contact_number} onChange={handleChange} />
            <Input label="Mobile"           name="mobile_number" value={form.mobile_number} onChange={handleChange} />
            <Input label="Fax"              name="fax"           value={form.fax}           onChange={handleChange} />
            <Input label="Email"            name="email_address" value={form.email_address} onChange={handleChange} type="email" />
            <Input label="Site web"         name="website"       value={form.website}       onChange={handleChange} />
            <Select label="Statut"          name="status_id"     value={String(form.status_id)} onChange={handleChange}
              options={[{ value: '1', label: 'Actif' }, { value: '0', label: 'Inactif' }]}
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onCancel={() => setConfirm(null)}
        onConfirm={handleDelete}
        message={`Supprimer l'hôpital "${confirm?.hospital_name}" ? Cette action est irréversible.`}
      />
    </div>
  )
}
