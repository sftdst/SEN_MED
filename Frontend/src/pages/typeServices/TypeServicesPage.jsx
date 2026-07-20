import { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
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
import Pagination from '../../components/ui/Pagination'

const emptyForm = { NomType: '', description: '', status: 1, IDgen_mst_Departement: '' }

// ── Parsing fichier (CSV ou XLS/XLSX) avec SheetJS ───────────────────────────
const parseFile = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = e => {
    try {
      const data     = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet    = workbook.Sheets[workbook.SheetNames[0]]
      // header: 1 → tableau de tableaux bruts
      const rows     = XLSX.utils.sheet_to_json(sheet, { defval: '' })
      resolve(rows)
    } catch (err) { reject(err) }
  }
  reader.onerror = reject
  reader.readAsArrayBuffer(file)
})

// ── Modal Import ──────────────────────────────────────────────────────────────
function ImportModal({ open, onClose, onImported, departements }) {
  const inputRef  = useRef(null)
  const [file, setFile]         = useState(null)
  const [deptId, setDeptId]     = useState('')    // département sélectionné dans l'UI
  const [preview, setPreview]   = useState(null)  // { rows, colonnes }
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)

  const reset = () => { setFile(null); setDeptId(''); setPreview(null); setResult(null) }
  const close = () => { reset(); onClose() }

  const depOptions = departements.map(d => ({
    value: String(d.IDgen_mst_Departement),
    label: d.NomDepartement,
  }))

  // Lecture + prévisualisation dès que le fichier change
  const handleFile = async e => {
    const f = e.target.files?.[0] || null
    e.target.value = ''
    setResult(null)
    setPreview(null)
    if (!f) return
    setFile(f)
    try {
      const rows = await parseFile(f)
      setPreview({ rows, count: rows.length })
    } catch {
      setPreview({ error: 'Impossible de lire ce fichier.' })
    }
  }

  // Télécharge le modèle XLS avec SheetJS
  const downloadTemplate = () => {
    const idEx  = departements[0]?.IDgen_mst_Departement ?? 1
    const data  = [
      { NomType: 'Consultation Générale', description: 'Consultations médicales standard', IDgen_mst_Departement: idEx, status: 1 },
      { NomType: 'Chirurgie',             description: 'Actes chirurgicaux courants',      IDgen_mst_Departement: idEx, status: 1 },
      { NomType: 'Urgences',              description: 'Prise en charge des urgences',     IDgen_mst_Departement: idEx, status: 1 },
    ]
    const ws  = XLSX.utils.json_to_sheet(data)
    const wb  = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Types de service')

    // Feuille de référence des départements
    if (departements.length > 0) {
      const wsRef = XLSX.utils.json_to_sheet(
        departements.map(d => ({ ID: d.IDgen_mst_Departement, Département: d.NomDepartement }))
      )
      XLSX.utils.book_append_sheet(wb, wsRef, 'Départements (ref)')
    }

    XLSX.writeFile(wb, 'modele_types_service.xlsx')
  }

  const handleImport = async () => {
    if (!preview?.rows?.length) return
    setLoading(true)
    try {
      // Appliquer le département sélectionné dans l'UI sur toutes les lignes (prioritaire)
      let rows = preview.rows
      if (deptId) {
        rows = rows.map(r => ({ ...r, IDgen_mst_Departement: Number(deptId) }))
      }
      const res = await typeServiceApi.importer(rows)
      setResult(res.data)
      if (res.data.created > 0) onImported()
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de l\'import.'
      setResult({ success: false, message: msg, errors: [] })
    } finally { setLoading(false) }
  }

  if (!open) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
    }}
      onClick={e => { if (e.target === e.currentTarget) close() }}
    >
      <div style={{
        background: colors.white, borderRadius: radius.lg,
        width: '100%', maxWidth: 580, boxShadow: shadows.xl,
        overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          background: colors.bleu, color: colors.white,
          padding: '14px 20px', flexShrink: 0,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>📥 Importer des types de service</span>
          <button onClick={close} style={{ background: 'none', border: 'none', color: colors.white, fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>

        {/* Corps scrollable */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>

          {/* Étape 1 — template */}
          <div style={{
            background: `${colors.bleu}08`, border: `1px solid ${colors.bleu}30`,
            borderRadius: radius.md, padding: '12px 14px',
          }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: colors.bleu, marginBottom: 6 }}>
              Étape 1 — Télécharger le modèle
            </div>
            <div style={{ fontSize: 12, color: colors.gray600, marginBottom: 10 }}>
              Colonnes requises : <strong>NomType, description, IDgen_mst_Departement</strong>
              <br/>Le département peut être laissé vide si vous le sélectionnez ci-dessous.
            </div>
            <Button size="sm" variant="secondary" onClick={downloadTemplate}>
              📄 Télécharger le modèle (.xlsx)
            </Button>
          </div>

          {/* Étape 2 — département (optionnel) */}
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: colors.gray700, marginBottom: 8 }}>
              Étape 2 — Département (optionnel)
            </div>
            <Select
              name="deptId"
              value={deptId}
              onChange={e => setDeptId(e.target.value)}
              options={depOptions}
              placeholder="Appliquer à tous les types importés..."
              style={{ marginBottom: 0 }}
            />
            {deptId && (
              <div style={{ fontSize: 11, color: colors.bleu, marginTop: 4 }}>
                Le département sélectionné écrasera celui du fichier pour toutes les lignes.
              </div>
            )}
          </div>

          {/* Étape 3 — upload */}
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: colors.gray700, marginBottom: 8 }}>
              Étape 3 — Choisir le fichier
            </div>
            <div style={{
              background: colors.gray50, border: `2px dashed ${file ? colors.success : colors.gray300}`,
              borderRadius: radius.md, padding: '16px', textAlign: 'center',
              cursor: 'pointer', transition: 'border-color 0.2s',
            }}
              onClick={() => inputRef.current?.click()}
            >
              {file ? (
                <div>
                  <div style={{ fontSize: 26 }}>📋</div>
                  <div style={{ fontWeight: 600, marginTop: 4, color: colors.success }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: colors.gray500, marginTop: 2 }}>
                    {(file.size / 1024).toFixed(1)} Ko — Cliquer pour changer
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 30, color: colors.gray400 }}>📁</div>
                  <div style={{ fontWeight: 600, marginTop: 4, color: colors.gray600 }}>
                    Cliquer pour choisir un fichier
                  </div>
                  <div style={{ fontSize: 12, color: colors.gray400, marginTop: 2 }}>
                    .csv, .xls, .xlsx — max 5 Mo
                  </div>
                </div>
              )}
              <input
                ref={inputRef} type="file"
                accept=".csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                onChange={handleFile} style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Prévisualisation */}
          {preview && !preview.error && (
            <div style={{
              background: colors.gray50, borderRadius: radius.md,
              border: `1px solid ${colors.gray200}`, padding: '10px 14px',
              fontSize: 13,
            }}>
              <span style={{ fontWeight: 600 }}>Aperçu :</span>{' '}
              {preview.count} ligne{preview.count > 1 ? 's' : ''} détectée{preview.count > 1 ? 's' : ''}
              {preview.count > 0 && (
                <div style={{ marginTop: 8, overflowX: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 11 }}>
                    <thead>
                      <tr>
                        {Object.keys(preview.rows[0]).map(k => (
                          <th key={k} style={{ padding: '4px 8px', background: colors.gray200, textAlign: 'left', whiteSpace: 'nowrap' }}>{k}</th>
                        ))}
                      </tr>
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

          {preview?.error && (
            <div style={{ color: colors.danger, fontSize: 13 }}>❌ {preview.error}</div>
          )}

          {/* Résultat import */}
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
                  <div style={{
                    maxHeight: 100, overflowY: 'auto', background: colors.white,
                    borderRadius: 4, padding: '6px 10px', fontSize: 12, color: colors.gray700,
                  }}>
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
          <Button onClick={handleImport} disabled={!preview?.rows?.length || loading}>
            {loading ? 'Import en cours...' : `📥 Importer${preview?.count ? ` (${preview.count} lignes)` : ''}`}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function TypeServicesPage() {
  const [data, setData]                       = useState([])
  const [paginationMeta, setPaginationMeta]   = useState(null)
  const [page, setPage]                       = useState(1)
  const [perPage, setPerPage]                 = useState(15)
  const [departements, setDeps]               = useState([])
  const [loading, setLoading]                 = useState(true)
  const [search, setSearch]                   = useState('')
  const [filterDep, setFilterDep]             = useState('')
  const [modal, setModal]                     = useState(false)
  const [importModal, setImportModal]         = useState(false)
  const [editing, setEditing]                 = useState(null)
  const [form, setForm]                       = useState(emptyForm)
  const [saving, setSaving]                   = useState(false)
  const [confirm, setConfirm]                 = useState(null)

  const load = (p = page, pp = perPage) => {
    setLoading(true)
    const params = { page: p, per_page: pp }
    if (filterDep) params.IDgen_mst_Departement = filterDep
    if (search)    params.search = search
    Promise.all([
      typeServiceApi.liste(params),
      departementApi.liste(),
    ]).then(([t, d]) => {
      const result = t.data.data
      setData(result?.data || [])
      setPaginationMeta(result?.last_page ? result : null)
      const toArr = v => Array.isArray(v) ? v : (v?.data ?? [])
      setDeps(toArr(d.data.data))
    }).finally(() => setLoading(false))
  }

  useEffect(() => { setPage(1); load(1, perPage) }, [filterDep, search])

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
    { key: 'services', title: 'Services', align: 'center',
      render: (_, row) => <span style={{ fontWeight: 700, color: colors.orange }}>{row.services?.length ?? 0}</span>
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
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={() => setImportModal(true)} icon="📥">
              Importer CSV
            </Button>
            <Button onClick={openCreate} icon="➕">Nouveau type</Button>
          </div>
        }
      />

      <div style={{
        background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm,
        padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap',
      }}>
        <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200, marginBottom: 0 }} />
        <Select name="filterDep" value={filterDep} onChange={e => setFilterDep(e.target.value)}
          options={depOptions} placeholder="Tous les départements" style={{ minWidth: 220, marginBottom: 0 }}
        />
        <div style={{ color: colors.gray500, fontSize: 13 }}>
          {paginationMeta ? paginationMeta.total : data.length} résultat{(paginationMeta?.total ?? data.length) !== 1 ? 's' : ''}
        </div>
      </div>

      <div style={{ background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm, overflow: 'hidden' }}>
        {loading ? <FullPageSpinner /> : (
          <>
            <Table columns={columns} data={data} emptyText="Aucun type de service enregistré." />
            <Pagination
              meta={paginationMeta}
              onPageChange={p => { setPage(p); load(p, perPage) }}
              onPerPageChange={pp => { setPerPage(pp); setPage(1); load(1, pp) }}
            />
          </>
        )}
      </div>

      {/* Modal Créer / Modifier */}
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

      {/* Modal Import */}
      <ImportModal
        open={importModal}
        onClose={() => setImportModal(false)}
        onImported={() => { showToast('Import réussi !', 'success'); load() }}
        departements={departements}
      />

      <ConfirmDialog
        open={!!confirm} onCancel={() => setConfirm(null)} onConfirm={handleDelete}
        message={`Supprimer le type de service "${confirm?.NomType}" ?`}
      />
    </div>
  )
}
