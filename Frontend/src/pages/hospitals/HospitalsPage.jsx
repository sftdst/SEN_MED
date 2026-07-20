import { useEffect, useRef, useState } from 'react'
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
import Pagination from '../../components/ui/Pagination'

const emptyForm = {
  hospital_name: '', short_name: '', adress: '', postal_code: '',
  zip_code: '', fax: '', mobile_number: '', contact_number: '',
  email_address: '', website: '', status_id: 1, type_cabinet: '',
}

// ── Composant upload logo ─────────────────────────────────────────────────────
function LogoUploader({ currentUrl, onFile, onDelete, canDelete }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(currentUrl || null)

  useEffect(() => { setPreview(currentUrl || null) }, [currentUrl])

  const handlePick = e => {
    const file = e.target.files?.[0]
    if (!file) return
    onFile(file)
    setPreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  const handleRemove = () => {
    setPreview(null)
    onFile(null)
    if (canDelete) onDelete()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      {/* Zone d'affichage */}
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          width: 140, height: 140, borderRadius: radius.md,
          border: `2px dashed ${colors.gray300}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', overflow: 'hidden',
          background: colors.gray50,
          transition: 'border-color 0.2s',
          position: 'relative',
        }}
        title="Cliquer pour choisir un logo"
      >
        {preview ? (
          <img src={preview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} />
        ) : (
          <div style={{ textAlign: 'center', color: colors.gray400 }}>
            <div style={{ fontSize: 36 }}>🏥</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>Logo</div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{
            fontSize: 12, padding: '5px 12px', borderRadius: radius.sm,
            border: `1px solid ${colors.bleu}`, background: colors.white,
            color: colors.bleu, cursor: 'pointer', fontWeight: 600,
          }}
        >
          {preview ? '🔄 Changer' : '📁 Choisir'}
        </button>
        {preview && (
          <button
            type="button"
            onClick={handleRemove}
            style={{
              fontSize: 12, padding: '5px 12px', borderRadius: radius.sm,
              border: `1px solid ${colors.danger}`, background: colors.white,
              color: colors.danger, cursor: 'pointer', fontWeight: 600,
            }}
          >
            🗑️ Supprimer
          </button>
        )}
      </div>

      <div style={{ fontSize: 11, color: colors.gray400, textAlign: 'center' }}>
        JPG, PNG, SVG, WEBP — max 2 Mo
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/svg+xml,image/webp"
        onChange={handlePick}
        style={{ display: 'none' }}
      />
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function HospitalsPage() {
  const [data, setData]                       = useState([])
  const [paginationMeta, setPaginationMeta]   = useState(null)
  const [page, setPage]                       = useState(1)
  const [perPage, setPerPage]                 = useState(15)
  const [loading, setLoading]                 = useState(true)
  const [search, setSearch]                   = useState('')
  const [modal, setModal]                     = useState(false)
  const [editing, setEditing]                 = useState(null)
  const [form, setForm]                       = useState(emptyForm)
  const [logoFile, setLogoFile]               = useState(null)
  const [saving, setSaving]                   = useState(false)
  const [confirm, setConfirm]                 = useState(null)

  const load = (p = page, pp = perPage) => {
    setLoading(true)
    const params = { page: p, per_page: pp }
    if (search) params.search = search
    hospitalApi.liste(params).then(r => {
      const result = r.data.data
      setData(result?.data || [])
      setPaginationMeta(result?.last_page ? result : null)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { setPage(1); load(1, perPage) }, [search])
  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null); setForm(emptyForm); setLogoFile(null); setModal(true)
  }
  const openEdit = (row) => {
    setEditing(row); setForm({ ...emptyForm, ...row }); setLogoFile(null); setModal(true)
  }
  const closeModal = () => { setModal(false); setEditing(null); setLogoFile(null) }

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleDeleteLogo = async () => {
    if (!editing?.id_Rep) return
    try {
      const res = await hospitalApi.supprimerLogo(editing.id_Rep)
      setEditing(res.data.data)
      showToast('Logo supprimé.')
      load()
    } catch { showToast('Erreur lors de la suppression du logo.', 'error') }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await hospitalApi.modifier(editing.id_Rep, form, logoFile)
        showToast('Hôpital mis à jour avec succès.')
      } else {
        await hospitalApi.creer(form, logoFile)
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
    {
      key: 'logo_url', title: 'Logo', width: 70, align: 'center',
      render: (v) => v
        ? <img src={v} alt="logo" style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 6, border: `1px solid ${colors.gray200}` }} />
        : <div style={{ width: 44, height: 44, borderRadius: 6, background: colors.gray100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, margin: '0 auto' }}>🏥</div>
    },
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
        actions={<Button onClick={openCreate} icon="➕">Nouvel hôpital</Button>}
      />

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
          {paginationMeta ? paginationMeta.total : data.length} résultat{(paginationMeta?.total ?? data.length) !== 1 ? 's' : ''}
        </div>
      </div>

      <div style={{ background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm, overflow: 'hidden' }}>
        {loading ? <FullPageSpinner /> : (
          <>
            <Table columns={columns} data={data} emptyText="Aucun hôpital enregistré." />
            <Pagination
              meta={paginationMeta}
              onPageChange={p => { setPage(p); load(p, perPage) }}
              onPerPageChange={pp => { setPerPage(pp); setPage(1); load(1, pp) }}
            />
          </>
        )}
      </div>

      <Modal
        open={modal}
        onClose={closeModal}
        title={editing ? '✏️ Modifier l\'hôpital' : '➕ Nouvel hôpital'}
        width={720}
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
          {/* Logo en haut, centré */}
          <div style={{
            display: 'flex', justifyContent: 'center',
            marginBottom: 20, paddingBottom: 20,
            borderBottom: `1px solid ${colors.gray100}`,
          }}>
            <LogoUploader
              currentUrl={editing?.logo_url || null}
              onFile={setLogoFile}
              onDelete={handleDeleteLogo}
              canDelete={!!editing?.logo}
            />
          </div>

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
            <Input label="Adresse"          name="adress"          value={form.adress}          onChange={handleChange} style={{ gridColumn: '1/-1' }} />
            <Input label="Code postal"      name="postal_code"     value={form.postal_code}     onChange={handleChange} />
            <Input label="Code ZIP"         name="zip_code"        value={form.zip_code}        onChange={handleChange} />
            <Input label="Téléphone"        name="contact_number"  value={form.contact_number}  onChange={handleChange} />
            <Input label="Mobile"           name="mobile_number"   value={form.mobile_number}   onChange={handleChange} />
            <Input label="Fax"              name="fax"             value={form.fax}             onChange={handleChange} />
            <Input label="Email"            name="email_address"   value={form.email_address}   onChange={handleChange} type="email" />
            <Input label="Site web"         name="website"         value={form.website}         onChange={handleChange} />
            <Select label="Statut"          name="status_id"       value={String(form.status_id)} onChange={handleChange}
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
