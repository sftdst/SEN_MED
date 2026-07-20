import { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { serviceApi, typeServiceApi, departementApi } from '../../api'
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
import SearchBar from '../../components/ui/SearchBar'
import Pagination from '../../components/ui/Pagination'

const emptyForm = {
  id_gen_mst_service: '', n_ordre: '', short_name: '', tri_name: '',
  code_local: '', cle_tarif_service: '', groupe_id: '', categorie_id: '',
  type_categorie: '', status: 0, valeur_cts: '', majoration_ferie: '',
  code_snomed: '', code_hl7: '', IDgen_mst_Type_Service: '',
}

// ── Parsing fichier (CSV ou XLS/XLSX) ────────────────────────────────────────
const parseFile = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = e => {
    try {
      const wb   = XLSX.read(new Uint8Array(e.target.result), { type: 'array' })
      const ws   = wb.Sheets[wb.SheetNames[0]]
      resolve(XLSX.utils.sheet_to_json(ws, { defval: '' }))
    } catch (err) { reject(err) }
  }
  reader.onerror = reject
  reader.readAsArrayBuffer(file)
})

// ── Modal Import Services ─────────────────────────────────────────────────────
function ImportServicesModal({ open, onClose, onImported }) {
  const inputRef = useRef(null)

  const [departements, setDepts]   = useState([])
  const [allTypes, setAllTypes]     = useState([])
  const [deptId, setDeptId]         = useState('')
  const [typeId, setTypeId]         = useState('')
  const [file, setFile]             = useState(null)
  const [preview, setPreview]       = useState(null)
  const [loading, setLoading]       = useState(false)
  const [result, setResult]         = useState(null)

  // Charger départements + types à l'ouverture
  useEffect(() => {
    if (!open) return
    Promise.all([
      departementApi.liste({ per_page: 200 }),
      typeServiceApi.liste({ per_page: 200 }),
    ]).then(([d, t]) => {
      setDepts(d.data?.data?.data ?? [])
      setAllTypes(t.data?.data?.data ?? [])
    }).catch(() => {})
  }, [open])

  // Types filtrés par département sélectionné
  const types = deptId
    ? allTypes.filter(t => String(t.IDgen_mst_Departement) === deptId)
    : allTypes

  const deptOptions = departements.map(d => ({ value: String(d.IDgen_mst_Departement), label: d.NomDepartement }))
  const typeOptions = types.map(t => ({ value: String(t.IDgen_mst_Type_Service), label: t.NomType }))

  const reset = () => { setFile(null); setPreview(null); setResult(null); setDeptId(''); setTypeId('') }
  const close = () => { reset(); onClose() }

  const handleDeptChange = e => { setDeptId(e.target.value); setTypeId('') }

  const handleFile = async e => {
    const f = e.target.files?.[0] || null
    e.target.value = ''
    setResult(null); setPreview(null)
    if (!f) return
    setFile(f)
    try {
      const rows = await parseFile(f)
      setPreview({ rows, count: rows.length })
    } catch { setPreview({ error: 'Impossible de lire ce fichier.' }) }
  }

  // Télécharge le modèle .xlsx — colonnes simplifiées, sans IDs techniques
  const downloadTemplate = () => {
    const selectedTypeName = types.find(t => String(t.IDgen_mst_Type_Service) === typeId)?.NomType || 'Type sélectionné dans l\'interface'
    const data = [
      { tri_name: 'Consultation simple',  short_name: 'CONS', valeur_cts: '5000',  type_categorie: 'Clinique',    status: 1 },
      { tri_name: 'Analyse sanguine NFS', short_name: 'NFS',  valeur_cts: '12000', type_categorie: 'Laboratoire', status: 1 },
      { tri_name: 'Radio pulmonaire',     short_name: 'RX',   valeur_cts: '15000', type_categorie: 'Imagerie',    status: 1 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Services à importer')

    // Feuille d'info : rappel du type sélectionné
    const infoRows = [
      { Information: 'Type de service', Valeur: selectedTypeName },
      { Information: 'NomDepartement', Valeur: departements.find(d => String(d.IDgen_mst_Departement) === deptId)?.NomDepartement || 'Tous' },
      { Information: 'Colonnes obligatoires', Valeur: 'tri_name (libellé du service)' },
      { Information: 'Colonnes optionnelles', Valeur: 'short_name, valeur_cts, type_categorie, status (0/1)' },
      { Information: 'Injecté automatiquement', Valeur: 'Type de service sélectionné dans l\'interface' },
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(infoRows), 'Instructions')
    XLSX.writeFile(wb, 'modele_import_services.xlsx')
  }

  const handleImport = async () => {
    if (!preview?.rows?.length || !typeId) return
    setLoading(true)
    try {
      const rows = preview.rows.map(r => ({ ...r, IDgen_mst_Type_Service: Number(typeId) }))
      const res  = await serviceApi.importer(rows)
      setResult(res.data)
      if (res.data.created > 0) onImported()
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de l\'import.'
      setResult({ success: false, message: msg, errors: [] })
    } finally { setLoading(false) }
  }

  if (!open) return null

  const canImport = !!preview?.rows?.length && !!typeId && !loading

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
    }} onClick={e => { if (e.target === e.currentTarget) close() }}>
      <div style={{
        background: colors.white, borderRadius: radius.lg,
        width: '100%', maxWidth: 620, boxShadow: shadows.xl,
        display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: colors.bleu, color: colors.white, padding: '14px 20px', flexShrink: 0,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>📥 Importer des services</span>
          <button onClick={close} style={{ background: 'none', border: 'none', color: colors.white, fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>

        {/* Corps */}
        <div style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Template */}
          <div style={{ background: `${colors.bleu}08`, border: `1px solid ${colors.bleu}30`, borderRadius: radius.md, padding: '12px 14px' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: colors.bleu, marginBottom: 8 }}>
              Étape 1 — Télécharger le modèle
            </div>
            <div style={{ fontSize: 12, color: colors.gray600, marginBottom: 4, lineHeight: 1.7 }}>
              <div>✅ <strong>Colonne obligatoire :</strong> <code style={{ background: colors.gray100, padding: '1px 5px', borderRadius: 3 }}>tri_name</code> — libellé du service</div>
              <div>📝 <strong>Colonnes optionnelles :</strong> <code style={{ background: colors.gray100, padding: '1px 5px', borderRadius: 3 }}>short_name</code>, <code style={{ background: colors.gray100, padding: '1px 5px', borderRadius: 3 }}>valeur_cts</code>, <code style={{ background: colors.gray100, padding: '1px 5px', borderRadius: 3 }}>type_categorie</code>, <code style={{ background: colors.gray100, padding: '1px 5px', borderRadius: 3 }}>status</code></div>
              <div style={{ color: colors.success, fontWeight: 600 }}>🔒 <strong>Injecté automatiquement :</strong> le type de service sélectionné (vous n'avez pas besoin de le mettre dans le fichier)</div>
            </div>
            <Button size="sm" variant="secondary" onClick={downloadTemplate} style={{ marginTop: 8 }}>
              📄 Télécharger le modèle (.xlsx)
            </Button>
          </div>

          {/* Sélecteur département + type de service */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: colors.gray700, marginBottom: 6 }}>
                Étape 2 — Département
              </div>
              <select
                value={deptId} onChange={handleDeptChange}
                style={{ width: '100%', border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm, padding: '8px 10px', fontSize: 13, background: colors.white, outline: 'none' }}
              >
                <option value="">Tous les départements</option>
                {deptOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: colors.gray700, marginBottom: 6 }}>
                Étape 3 — Type de service <span style={{ color: colors.danger }}>*</span>
              </div>
              <select
                value={typeId} onChange={e => setTypeId(e.target.value)}
                style={{
                  width: '100%',
                  border: `1.5px solid ${typeId ? colors.success : colors.danger}`,
                  borderRadius: radius.sm, padding: '8px 10px', fontSize: 13,
                  background: colors.white, outline: 'none',
                }}
              >
                <option value="">-- Sélectionner --</option>
                {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {!typeId && <div style={{ fontSize: 11, color: colors.danger, marginTop: 4 }}>Obligatoire avant l'import</div>}
            </div>
          </div>

          {/* Upload fichier */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: colors.gray700, marginBottom: 8 }}>
              Étape 4 — Choisir le fichier
            </div>
            <div style={{
              background: colors.gray50, border: `2px dashed ${file ? colors.success : colors.gray300}`,
              borderRadius: radius.md, padding: '16px', textAlign: 'center', cursor: 'pointer',
            }} onClick={() => inputRef.current?.click()}>
              {file ? (
                <>
                  <div style={{ fontSize: 26 }}>📋</div>
                  <div style={{ fontWeight: 600, marginTop: 4, color: colors.success }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: colors.gray500, marginTop: 2 }}>{(file.size / 1024).toFixed(1)} Ko — Cliquer pour changer</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 30, color: colors.gray400 }}>📁</div>
                  <div style={{ fontWeight: 600, marginTop: 4, color: colors.gray600 }}>Cliquer pour choisir un fichier</div>
                  <div style={{ fontSize: 12, color: colors.gray400, marginTop: 2 }}>.csv, .xls, .xlsx</div>
                </>
              )}
              <input ref={inputRef} type="file"
                accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFile} style={{ display: 'none' }} />
            </div>
          </div>

          {/* Aperçu */}
          {preview && !preview.error && (
            <div style={{ background: colors.gray50, borderRadius: radius.md, border: `1px solid ${colors.gray200}`, padding: '10px 14px', fontSize: 13 }}>
              <span style={{ fontWeight: 600 }}>Aperçu :</span>{' '}
              {preview.count} ligne{preview.count > 1 ? 's' : ''} détectée{preview.count > 1 ? 's' : ''}
              {preview.count > 0 && (
                <div style={{ marginTop: 8, overflowX: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 11 }}>
                    <thead>
                      <tr>{Object.keys(preview.rows[0]).map(k => (
                        <th key={k} style={{ padding: '4px 8px', background: colors.gray200, textAlign: 'left', whiteSpace: 'nowrap' }}>{k}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {preview.rows.slice(0, 3).map((row, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${colors.gray100}` }}>
                          {Object.values(row).map((v, j) => (
                            <td key={j} style={{ padding: '4px 8px', whiteSpace: 'nowrap', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{String(v)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {preview.count > 3 && (
                    <div style={{ fontSize: 11, color: colors.gray500, marginTop: 4, textAlign: 'center' }}>
                      ... et {preview.count - 3} autre{preview.count - 3 > 1 ? 's' : ''} ligne{preview.count - 3 > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {preview?.error && <div style={{ color: colors.danger, fontSize: 13 }}>❌ {preview.error}</div>}

          {/* Résultat */}
          {result && (
            <div style={{
              borderRadius: radius.md, padding: '12px 14px',
              background: result.success ? `${colors.success}10` : `${colors.danger}10`,
              border: `1px solid ${result.success ? colors.success : colors.danger}40`,
            }}>
              <div style={{ fontWeight: 700, color: result.success ? colors.success : colors.danger, marginBottom: 6 }}>
                {result.success ? '✅' : '❌'} {result.message}
              </div>
              {result.errors?.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: colors.warning, marginBottom: 4 }}>
                    Lignes ignorées ({result.errors.length}) :
                  </div>
                  <div style={{ maxHeight: 100, overflowY: 'auto', background: colors.white, borderRadius: 4, padding: '6px 10px', fontSize: 12, color: colors.gray700 }}>
                    {result.errors.map((e, i) => <div key={i}>• {e}</div>)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px', borderTop: `1px solid ${colors.gray100}`, flexShrink: 0,
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <Button variant="ghost" onClick={close}>Fermer</Button>
          <Button onClick={handleImport} disabled={!canImport}>
            {loading ? 'Import en cours...' : `📥 Importer${preview?.count ? ` (${preview.count} lignes)` : ''}`}
          </Button>
        </div>
      </div>
    </div>
  )
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
  const [importModal, setImportModal]         = useState(false)
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
      setTypes(t?.data?.data?.data || [])
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
    { key: 'tri_name', title: 'Libellé du service', render: (v, row) => (
      <div>
        <div style={{ fontWeight: 600, color: colors.bleu }}>{v || row.short_name || '—'}</div>
        <div style={{ fontSize: 12, color: colors.gray500 }}>Code: {row.id_gen_mst_service || '—'} | Local: {row.code_local || '—'}</div>
      </div>
    )},
    { key: 'type_service', title: 'Type de service', render: (_, row) => {
      const type = row.type_service || row.typeService
      return type?.NomType || '—'
    }},
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
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={() => setImportModal(true)} icon="📥">Importer CSV/Excel</Button>
            <Button onClick={openCreate} icon="➕">Nouveau service</Button>
          </div>
        }
      />

      <div style={{
        background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm,
        padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap',
      }}>
        <SearchBar value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un service..." />
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
              <Input label="Libellé"         name="tri_name"           value={form.tri_name}           onChange={handleChange} />
              <Input label="Libellé court"   name="short_name"         value={form.short_name}         onChange={handleChange} />
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

      <ImportServicesModal
        open={importModal}
        onClose={() => setImportModal(false)}
        onImported={() => { showToast('Services importés avec succès !', 'success'); load() }}
      />

      <ConfirmDialog
        open={!!confirm} onCancel={() => setConfirm(null)} onConfirm={handleDelete}
        message={`Supprimer le service "${confirm?.tri_name || confirm?.short_name || confirm?.id_gen_mst_service}" ?`}
      />
    </div>
  )
}
