import { useEffect, useState } from 'react'
import { serviceApi, typeServiceApi } from '../../api'
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
  id_gen_mst_service: '', n_ordre: '', short_name: '', tri_name: '',
  code_local: '', cle_tarif_service: '', groupe_id: '', categorie_id: '',
  type_categorie: '', status: 0, valeur_cts: '', majoration_ferie: '',
  code_snomed: '', code_hl7: '', IDgen_mst_Type_Service: '',
}

export default function ServicesPage() {
  const [data, setData]                       = useState([])
  const [paginationMeta, setPaginationMeta]   = useState(null)
  const [page, setPage]                       = useState(1)
  const [perPage, setPerPage]                 = useState(15)
  const [typeServices, setTypes]              = useState([])
  const [loading, setLoading]                 = useState(true)
  const [search, setSearch]                   = useState('')
  const [filterType, setFilterType]           = useState('')
  const [modal, setModal]                     = useState(false)
  const [editing, setEditing]                 = useState(null)
  const [form, setForm]                       = useState(emptyForm)
  const [saving, setSaving]                   = useState(false)
  const [confirm, setConfirm]                 = useState(null)

  const load = (p = page, pp = perPage) => {
    setLoading(true)
    const params = { page: p, per_page: pp }
    if (filterType) params.IDgen_mst_Type_Service = filterType
    if (search)     params.search = search
    Promise.all([
      serviceApi.liste(params),
      typeServiceApi.liste(),
    ]).then(([s, t]) => {
      const result = s.data.data
      setData(result?.data || [])
      setPaginationMeta(result?.last_page ? result : null)
      const toArr = v => Array.isArray(v) ? v : (v?.data ?? [])
      setTypes(toArr(t.data.data))
    }).finally(() => setLoading(false))
  }

  useEffect(() => { setPage(1); load(1, perPage) }, [filterType, search])

  const typeOptions = typeServices.map(t => ({ value: String(t.IDgen_mst_Type_Service), label: t.NomType }))

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModal(true) }
  const openEdit   = (row) => { setEditing(row); setForm({ ...emptyForm, ...row }); setModal(true) }
  const closeModal = () => { setModal(false); setEditing(null) }
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true)
    try {
      if (editing) {
        await serviceApi.modifier(editing.id_service, form)
        showToast('Service mis à jour.')
      } else {
        await serviceApi.creer(form)
        showToast('Service créé.')
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
      await serviceApi.supprimer(confirm.id_service)
      showToast('Service supprimé.'); setConfirm(null); load()
    } catch { showToast('Erreur lors de la suppression.', 'error') }
  }

  const columns = [
    { key: 'short_name', title: 'Libellé du service', render: (v, row) => (
      <div>
        <div style={{ fontWeight: 600, color: colors.bleu }}>{v || '—'}</div>
        <div style={{ fontSize: 12, color: colors.gray500 }}>Code: {row.id_gen_mst_service || '—'} | Local: {row.code_local || '—'}</div>
      </div>
    )},
    { key: 'typeService', title: 'Type de service', render: (_, row) => row.typeService?.NomType || '—' },
    { key: 'type_categorie', title: 'Catégorie' },
    { key: 'valeur_cts',     title: 'Valeur CTS' },
    { key: 'status', title: 'Statut', align: 'center', render: v => <StatusBadge status={v} /> },
    { key: 'id_service', title: 'Actions', align: 'center', width: 130,
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
        title="Gestion des Services"
        subtitle="Services médicaux et prestations disponibles"
        actions={<Button onClick={openCreate} icon="➕">Nouveau service</Button>}
      />

      <div style={{
        background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm,
        padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap',
      }}>
        <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200, marginBottom: 0 }} />
        <Select name="filterType" value={filterType} onChange={e => setFilterType(e.target.value)}
          options={typeOptions} placeholder="Tous les types" style={{ minWidth: 220, marginBottom: 0 }}
        />
        <div style={{ color: colors.gray500, fontSize: 13 }}>
          {paginationMeta ? paginationMeta.total : data.length} résultat{(paginationMeta?.total ?? data.length) !== 1 ? 's' : ''}
        </div>
      </div>

      <div style={{ background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm, overflow: 'hidden' }}>
        {loading ? <FullPageSpinner /> : (
          <>
            <Table columns={columns} data={data} emptyText="Aucun service enregistré." />
            <Pagination
              meta={paginationMeta}
              onPageChange={p => { setPage(p); load(p, perPage) }}
              onPerPageChange={pp => { setPerPage(pp); setPage(1); load(1, pp) }}
            />
          </>
        )}
      </div>

      <Modal
        open={modal} onClose={closeModal}
        title={editing ? '✏️ Modifier le service' : '➕ Nouveau service'}
        width={720}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Créer'}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          {/* Section identité */}
          <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${colors.gray100}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: colors.orange, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Identification</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Input label="Code service"    name="id_gen_mst_service" value={form.id_gen_mst_service} onChange={handleChange} />
              <Input label="Libellé court"   name="short_name"         value={form.short_name}         onChange={handleChange} />
              <Input label="Libellé trigramme" name="tri_name"         value={form.tri_name}           onChange={handleChange} />
              <Input label="N° d'ordre"      name="n_ordre"            value={form.n_ordre}            onChange={handleChange} />
            </div>
          </div>
          {/* Section classification */}
          <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${colors.gray100}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: colors.orange, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Classification</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Select label="Type de service" name="IDgen_mst_Type_Service" value={String(form.IDgen_mst_Type_Service)} onChange={handleChange} required options={typeOptions} placeholder="Sélectionner" />
              <Input  label="Code local"      name="code_local"            value={form.code_local}      onChange={handleChange} />
              <Input  label="Catégorie"       name="categorie_id"          value={form.categorie_id}    onChange={handleChange} />
              <Input  label="Type catégorie"  name="type_categorie"        value={form.type_categorie}  onChange={handleChange} />
              <Input  label="Groupe"          name="groupe_id"             value={form.groupe_id}       onChange={handleChange} />
              <Select label="Statut"          name="status"                value={String(form.status)}  onChange={handleChange}
                options={[{ value: '1', label: 'Actif' }, { value: '0', label: 'Inactif' }]}
              />
            </div>
          </div>
          {/* Section tarification */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: colors.orange, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Tarification & Codes</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Input label="Clé tarif service"  name="cle_tarif_service" value={form.cle_tarif_service} onChange={handleChange} />
              <Input label="Valeur CTS"          name="valeur_cts"        value={form.valeur_cts}        onChange={handleChange} />
              <Input label="Majoration férié"    name="majoration_ferie"  value={form.majoration_ferie}  onChange={handleChange} />
              <Input label="Code SNOMED"         name="code_snomed"       value={form.code_snomed}       onChange={handleChange} />
              <Input label="Code HL7"            name="code_hl7"          value={form.code_hl7}          onChange={handleChange} />
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirm} onCancel={() => setConfirm(null)} onConfirm={handleDelete}
        message={`Supprimer le service "${confirm?.short_name || confirm?.id_gen_mst_service}" ?`}
      />
    </div>
  )
}
