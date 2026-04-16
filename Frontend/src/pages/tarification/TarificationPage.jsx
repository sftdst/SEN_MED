import { useState, useEffect, useMemo } from 'react'
import { colors, radius, shadows } from '../../theme'
import { serviceApi, personnelApi, medecinTarifApi } from '../../api'
import { showToast } from '../../components/ui/Toast'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => n != null ? Number(n).toLocaleString('fr-FR') + ' F' : '—'

function Badge({ children, variant = 'default' }) {
  const MAP = {
    success:  { bg: colors.successBg,  color: colors.success  },
    danger:   { bg: colors.dangerBg,   color: colors.danger   },
    warning:  { bg: colors.warningBg,  color: colors.warning  },
    info:     { bg: colors.infoBg,     color: colors.info     },
    orange:   { bg: '#fff3ee',         color: colors.orange   },
    default:  { bg: colors.gray100,    color: colors.gray700  },
  }
  const s = MAP[variant] || MAP.default
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 9px', borderRadius: radius.full,
      background: s.bg, color: s.color,
      fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 4, height: 4, borderRadius: '50%', background: s.color }} />
      {children}
    </span>
  )
}

function FieldLabel({ children, required }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, color: colors.gray600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 5 }}>
      {children}{required && <span style={{ color: colors.danger, marginLeft: 3 }}>*</span>}
    </div>
  )
}

const inputSt = {
  width: '100%', boxSizing: 'border-box',
  border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm,
  padding: '8px 11px', fontSize: 12, color: colors.gray800,
  background: '#fff', outline: 'none',
}

// ── Onglets principaux ────────────────────────────────────────────────────────
const TABS = [
  { key: 'hopital',  label: '🏥 Tarifs Hôpital',     desc: "Tarifs de référence définis par l'établissement" },
  { key: 'medecin',  label: '👨‍⚕️ Tarifs Médecins', desc: 'Personnalisation des tarifs par médecin' },
]

// ════════════════════════════════════════════════════════════════════════════
export default function TarificationPage() {
  const [activeTab,  setActiveTab]  = useState('hopital')
  const [services,   setServices]   = useState([])
  const [medecins,   setMedecins]   = useState([])
  const [tarifs,     setTarifs]     = useState([])
  const [loading,    setLoading]    = useState(false)
  const [search,     setSearch]     = useState('')

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    // Chaque appel indépendant — si un échoue les autres continuent
    const [sRes, mRes, tRes] = await Promise.all([
      serviceApi.liste({ per_page: 200 }).catch(() => null),
      personnelApi.liste({ staff_type: 'medecin', per_page: 200 }).catch(() => null),
      medecinTarifApi.liste({ per_page: 500 }).catch(() => null),
    ])
    if (sRes) setServices(sRes.data?.data?.data ?? sRes.data?.data ?? [])
    if (mRes) setMedecins(mRes.data?.data?.data ?? mRes.data?.data ?? [])
    if (tRes) setTarifs(tRes.data?.data?.data   ?? tRes.data?.data ?? [])
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* En-tête */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.bleu} 0%, #003f7a 100%)`,
        borderRadius: radius.lg, padding: '18px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: shadows.md, flexWrap: 'wrap', gap: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: radius.md,
            background: colors.orange,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, boxShadow: `0 4px 12px ${colors.orange}50`,
          }}>💰</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>
              Tarification des Services
            </div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 3 }}>
              Tarifs hôpital · Tarifs personnalisés médecins · Majoration jours fériés
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'Services', val: services.length, color: 'rgba(255,255,255,0.8)', bg: 'rgba(255,255,255,0.1)',  border: 'rgba(255,255,255,0.2)' },
            { label: 'Médecins', val: medecins.length, color: colors.orange,          bg: `${colors.orange}20`,    border: `${colors.orange}40`    },
            { label: 'Tarifs',   val: tarifs.length,   color: '#4caf50',              bg: 'rgba(76,175,80,0.15)',  border: 'rgba(76,175,80,0.3)'   },
          ].map(s => (
            <div key={s.label} style={{
              textAlign: 'center', padding: '7px 16px',
              background: s.bg, borderRadius: radius.md, border: `1px solid ${s.border}`,
            }}>
              <div style={{ color: s.color, fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{s.val}</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Onglets */}
      <div style={{
        background: '#fff', borderRadius: radius.lg, boxShadow: shadows.sm,
        padding: '10px 12px', display: 'flex', gap: 8,
        border: `1px solid ${colors.gray200}`,
      }}>
        {TABS.map(t => {
          const active = t.key === activeTab
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                padding: '10px 18px', borderRadius: radius.sm, cursor: 'pointer',
                border: active ? `1.5px solid ${colors.orange}` : '1.5px solid transparent',
                background: active ? `${colors.orange}0f` : colors.gray100,
                color: active ? colors.orange : colors.gray600,
                transition: 'all 0.15s', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700 }}>{t.label}</span>
              <span style={{ fontSize: 10, marginTop: 2, opacity: 0.7, color: active ? colors.orange : colors.gray500 }}>
                {TABS.find(x => x.key === t.key)?.desc}
              </span>
            </button>
          )
        })}
      </div>

      {/* Corps */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: colors.gray500 }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
          Chargement des tarifs...
        </div>
      ) : activeTab === 'hopital' ? (
        <TarifsHopital services={services} search={search} setSearch={setSearch} onRefresh={loadAll} />
      ) : (
        <TarifsMedecins services={services} medecins={medecins} tarifs={tarifs} onRefresh={loadAll} />
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TARIFS HÔPITAL
// ════════════════════════════════════════════════════════════════════════════
function TarifsHopital({ services, search, setSearch, onRefresh }) {
  const [editing, setEditing] = useState(null)   // service object being edited
  const [saving,  setSaving]  = useState(false)
  const [form,    setForm]    = useState({})

  const filtered = useMemo(() => {
    if (!search.trim()) return services
    const q = search.toLowerCase()
    return services.filter(s =>
      (s.short_name     || '').toLowerCase().includes(q) ||
      (s.type_categorie || '').toLowerCase().includes(q) ||
      (s.code_local     || '').toLowerCase().includes(q)
    )
  }, [services, search])

  const openEdit = (svc) => {
    setEditing(svc)
    setForm({
      valeur_cts:       svc.valeur_cts       || '',
      majoration_ferie: svc.majoration_ferie || '',
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await serviceApi.modifier(editing.id_service, form)
      showToast('Tarif hôpital mis à jour', 'success')
      setEditing(null)
      onRefresh()
    } catch {
      showToast('Erreur lors de la mise à jour', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Formulaire d'édition inline */}
      {editing && (
        <div style={{
          background: '#fff', borderRadius: radius.lg,
          border: `2px solid ${colors.bleu}`,
          boxShadow: `0 4px 20px ${colors.bleu}18`,
          overflow: 'hidden',
        }}>
          {/* Header formulaire */}
          <div style={{
            background: `linear-gradient(135deg, ${colors.bleu}, #003f7a)`,
            padding: '12px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>
                ✏️ Modifier le tarif — {editing.short_name}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, marginTop: 2 }}>
                Ce tarif s'applique par défaut pour tous les médecins sans tarif personnalisé.
              </div>
            </div>
            <button
              onClick={() => setEditing(null)}
              style={{
                width: 30, height: 30, borderRadius: '50%', cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 16,
              }}
            >✕</button>
          </div>

          {/* Champs */}
          <div style={{ padding: '18px 20px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <FieldLabel required>Tarif de base (FCFA)</FieldLabel>
              <input
                type="number" min="0"
                value={form.valeur_cts ?? ''}
                onChange={e => setForm(p => ({ ...p, valeur_cts: e.target.value }))}
                placeholder="ex: 5000"
                style={inputSt}
                onFocus={e => e.target.style.borderColor = colors.bleu}
                onBlur={e  => e.target.style.borderColor = colors.gray300}
              />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <FieldLabel>Majoration jours fériés (%)</FieldLabel>
              <input
                type="number" min="0" max="100"
                value={form.majoration_ferie ?? ''}
                onChange={e => setForm(p => ({ ...p, majoration_ferie: e.target.value }))}
                placeholder="ex: 20"
                style={inputSt}
                onFocus={e => e.target.style.borderColor = colors.bleu}
                onBlur={e  => e.target.style.borderColor = colors.gray300}
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{
            padding: '12px 20px', borderTop: `1px solid ${colors.gray200}`,
            background: colors.gray50,
            display: 'flex', gap: 8, justifyContent: 'flex-end',
          }}>
            <button
              onClick={() => setEditing(null)}
              style={{
                padding: '8px 18px', borderRadius: radius.sm, cursor: 'pointer',
                border: `1px solid ${colors.gray300}`, background: '#fff',
                color: colors.gray700, fontSize: 12, fontWeight: 700,
              }}
            >Annuler</button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '8px 20px', borderRadius: radius.sm, cursor: 'pointer',
                border: 'none', background: colors.orange,
                color: '#fff', fontSize: 12, fontWeight: 700,
                opacity: saving ? 0.7 : 1,
              }}
            >{saving ? 'Enregistrement...' : '✓ Enregistrer'}</button>
          </div>
        </div>
      )}

      {/* Tableau des services */}
      <div style={{
        background: '#fff', borderRadius: radius.lg, boxShadow: shadows.sm,
        border: `1px solid ${colors.gray200}`, overflow: 'hidden',
      }}>
        {/* Barre outils */}
        <div style={{
          background: `linear-gradient(135deg, ${colors.bleu} 0%, #003f7a 100%)`,
          padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>🏥</span>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>Tarifs de Référence Hôpital</span>
            <span style={{
              background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)',
              fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: radius.full,
            }}>
              {filtered.length}
            </span>
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un service..."
            style={{
              ...inputSt, width: 220,
              background: 'rgba(255,255,255,0.12)',
              borderColor: 'rgba(255,255,255,0.2)',
              color: '#fff',
            }}
          />
        </div>

        {/* Note d'info */}
        <div style={{
          padding: '10px 18px', background: colors.infoBg,
          borderBottom: `1px solid ${colors.info}20`,
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <span style={{ fontSize: 14 }}>ℹ️</span>
          <span style={{ fontSize: 11, color: colors.info }}>
            Ces tarifs sont utilisés par défaut quand un médecin n'a pas configuré ses propres tarifs.
            La majoration s'applique automatiquement les jours fériés.
          </span>
        </div>

        {/* Tableau */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['#', 'Service', 'Catégorie', 'Code', 'Tarif de base', 'Majoration fériée', 'Statut', 'Action'].map((h, i) => (
                  <th key={i} style={{
                    padding: '10px 14px', background: colors.gray50,
                    color: colors.gray600, fontSize: 10, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                    textAlign: i >= 4 ? 'right' : 'left',
                    borderBottom: `2px solid ${colors.gray200}`, whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 30, textAlign: 'center', color: colors.gray500, fontStyle: 'italic' }}>
                    Aucun service trouvé
                  </td>
                </tr>
              ) : filtered.map((svc, i) => (
                <tr
                  key={svc.id_service}
                  style={{
                    background: editing?.id_service === svc.id_service
                      ? `${colors.bleu}08`
                      : i % 2 === 0 ? '#fff' : colors.gray50,
                    borderBottom: `1px solid ${colors.gray100}`,
                    borderLeft: editing?.id_service === svc.id_service
                      ? `3px solid ${colors.bleu}`
                      : '3px solid transparent',
                  }}
                >
                  <td style={{ padding: '11px 14px', fontSize: 11, color: colors.gray500 }}>{svc.id_service}</td>
                  <td style={{ padding: '11px 14px', fontSize: 12, fontWeight: 700, color: colors.bleu }}>{svc.short_name || '—'}</td>
                  <td style={{ padding: '11px 14px', fontSize: 11, color: colors.gray600 }}>{svc.type_categorie || '—'}</td>
                  <td style={{ padding: '11px 14px', fontSize: 11, color: colors.gray500, fontFamily: 'monospace' }}>{svc.code_local || '—'}</td>
                  <td style={{ padding: '11px 14px', fontSize: 12, fontWeight: 700, color: colors.orange, textAlign: 'right' }}>
                    {svc.valeur_cts
                      ? Number(svc.valeur_cts).toLocaleString('fr-FR') + ' F'
                      : <span style={{ color: colors.gray400 }}>Non défini</span>}
                  </td>
                  <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                    {svc.majoration_ferie && Number(svc.majoration_ferie) > 0
                      ? <Badge variant="warning">+{svc.majoration_ferie}%</Badge>
                      : <span style={{ fontSize: 11, color: colors.gray400 }}>—</span>}
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <Badge variant={svc.status === 1 ? 'success' : 'danger'}>
                      {svc.status === 1 ? 'Actif' : 'Inactif'}
                    </Badge>
                  </td>
                  <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                    <button
                      onClick={() => editing?.id_service === svc.id_service ? setEditing(null) : openEdit(svc)}
                      style={{
                        padding: '4px 12px', borderRadius: radius.sm, cursor: 'pointer',
                        border: `1.5px solid ${editing?.id_service === svc.id_service ? colors.orange : colors.bleu}`,
                        background: editing?.id_service === svc.id_service ? `${colors.orange}15` : `${colors.bleu}0d`,
                        color: editing?.id_service === svc.id_service ? colors.orange : colors.bleu,
                        fontSize: 10, fontWeight: 700, transition: 'all 0.13s',
                      }}
                    >
                      {editing?.id_service === svc.id_service ? '✕ Fermer' : '✏️ Modifier tarif'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TARIFS MÉDECINS
// ════════════════════════════════════════════════════════════════════════════
function TarifsMedecins({ services, medecins, tarifs, onRefresh }) {
  const [medecinId, setMedecinId] = useState('')
  const [panel,     setPanel]     = useState(null)   // null | 'add' | 'edit'
  const [editTarif, setEditTarif] = useState(null)
  const [form,      setForm]      = useState({})
  const [saving,    setSaving]    = useState(false)
  const [deleting,  setDeleting]  = useState(null)

  // Tarifs du médecin sélectionné, enrichis avec le service
  const tarifsMedecin = useMemo(() => {
    if (!medecinId) return []
    return tarifs
      .filter(t => t.medecin_id === medecinId)
      .map(t => ({
        ...t,
        serviceNom:  t.service?.short_name || services.find(s => s.id_service === t.service_id)?.short_name || '—',
        tarifHopital: services.find(s => s.id_service === t.service_id)?.valeur_cts,
      }))
  }, [medecinId, tarifs, services])

  // Services sans tarif personnalisé (pour l'ajout)
  const servicesSansTarif = useMemo(() => {
    const dejaConfigures = new Set(tarifsMedecin.map(t => t.service_id))
    return services.filter(s => !dejaConfigures.has(s.id_service))
  }, [services, tarifsMedecin])

  const medecin = medecins.find(m => m.user_id === medecinId)

  const openAdd = () => {
    setForm({ service_id: '', prix_service: '', majoration_ferie: 0, type_majoration: 'pourcentage', note: '' })
    setEditTarif(null)
    setPanel('add')
  }

  const openEdit = (tarif) => {
    setEditTarif(tarif)
    setForm({
      prix_service:     tarif.prix_service     ?? '',
      majoration_ferie: tarif.majoration_ferie ?? 0,
      type_majoration:  tarif.type_majoration  ?? 'pourcentage',
      note:             tarif.note             ?? '',
    })
    setPanel('edit')
  }

  const closePanel = () => { setPanel(null); setEditTarif(null) }

  const handleSave = async () => {
    if (!medecinId) return
    setSaving(true)
    try {
      if (panel === 'add') {
        await medecinTarifApi.creer({ ...form, medecin_id: medecinId })
        showToast('Tarif médecin ajouté', 'success')
      } else {
        await medecinTarifApi.modifier(editTarif.id, form)
        showToast('Tarif médecin modifié', 'success')
      }
      closePanel()
      onRefresh()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Erreur', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (tarif) => {
    setDeleting(tarif.id)
    try {
      await medecinTarifApi.supprimer(tarif.id)
      showToast('Tarif supprimé — le tarif hôpital sera utilisé', 'success')
      onRefresh()
    } catch {
      showToast('Erreur lors de la suppression', 'error')
    } finally {
      setDeleting(null)
    }
  }

  // Change de médecin → fermer le panel
  const handleMedecinChange = (e) => {
    setMedecinId(e.target.value)
    closePanel()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Sélection médecin */}
      <div style={{
        background: '#fff', borderRadius: radius.lg, boxShadow: shadows.sm,
        padding: '16px 20px', border: `1px solid ${colors.gray200}`,
      }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: colors.gray800, marginBottom: 10 }}>
          👨‍⚕️ Sélectionner un médecin
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={medecinId}
            onChange={handleMedecinChange}
            style={{ ...inputSt, flex: '1 1 280px', maxWidth: 400, cursor: 'pointer' }}
          >
            <option value="">— Choisir un médecin —</option>
            {medecins.map(m => (
              <option key={m.user_id} value={m.user_id}>
                Dr. {m.first_name} {m.last_name}
                {m.specialization ? ` (${m.specialization})` : ''}
              </option>
            ))}
          </select>
          {medecin && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 16px', background: `${colors.bleu}0a`,
              borderRadius: radius.md, border: `1px solid ${colors.bleu}20`,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: colors.bleu,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: 13,
              }}>
                {((medecin.first_name?.[0] || '') + (medecin.last_name?.[0] || '')).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: colors.bleu }}>
                  Dr. {medecin.first_name} {medecin.last_name}
                </div>
                <div style={{ fontSize: 10, color: colors.gray500 }}>
                  {medecin.specialization || 'Médecin Généraliste'} · {tarifsMedecin.length} tarif{tarifsMedecin.length !== 1 ? 's' : ''} configuré{tarifsMedecin.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {medecinId && (
        <>
          {/* Formulaire inline ajout / édition */}
          {panel && (
            <div style={{
              background: '#fff', borderRadius: radius.lg,
              border: `2px solid ${colors.orange}`,
              boxShadow: `0 4px 20px ${colors.orange}18`,
              overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{
                background: `linear-gradient(135deg, ${colors.orange}, #d96000)`,
                padding: '12px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>
                    {panel === 'add' ? '＋ Nouveau tarif pour ce médecin' : `✏️ Modifier — ${editTarif?.serviceNom}`}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 2 }}>
                    Laissez le tarif vide pour utiliser le tarif hôpital par défaut
                  </div>
                </div>
                <button
                  onClick={closePanel}
                  style={{
                    width: 30, height: 30, borderRadius: '50%', cursor: 'pointer',
                    border: '1px solid rgba(255,255,255,0.3)',
                    background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 16,
                  }}
                >✕</button>
              </div>

              {/* Champs */}
              <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Service (uniquement en mode ajout) */}
                {panel === 'add' && (
                  <div>
                    <FieldLabel required>Service</FieldLabel>
                    <select
                      value={form.service_id}
                      onChange={e => setForm(p => ({ ...p, service_id: e.target.value }))}
                      style={{ ...inputSt, cursor: 'pointer' }}
                      onFocus={e => e.target.style.borderColor = colors.orange}
                      onBlur={e  => e.target.style.borderColor = colors.gray300}
                    >
                      <option value="">— Sélectionner un service —</option>
                      {servicesSansTarif.map(s => (
                        <option key={s.id_service} value={s.id_service}>
                          {s.short_name}{s.valeur_cts ? ` (Hôpital: ${Number(s.valeur_cts).toLocaleString('fr-FR')} F)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {/* Tarif personnalisé */}
                  <div style={{ flex: '1 1 180px' }}>
                    <FieldLabel>Tarif personnalisé (FCFA)</FieldLabel>
                    <input
                      type="number" min="0"
                      value={form.prix_service ?? ''}
                      onChange={e => setForm(p => ({ ...p, prix_service: e.target.value }))}
                      placeholder="Vide = tarif hôpital"
                      style={inputSt}
                      onFocus={e => e.target.style.borderColor = colors.orange}
                      onBlur={e  => e.target.style.borderColor = colors.gray300}
                    />
                  </div>

                  {/* Majoration */}
                  <div style={{ flex: '1 1 130px' }}>
                    <FieldLabel>Majoration fériée</FieldLabel>
                    <input
                      type="number" min="0"
                      value={form.majoration_ferie ?? 0}
                      onChange={e => setForm(p => ({ ...p, majoration_ferie: e.target.value }))}
                      placeholder="ex: 20"
                      style={inputSt}
                      onFocus={e => e.target.style.borderColor = colors.orange}
                      onBlur={e  => e.target.style.borderColor = colors.gray300}
                    />
                  </div>

                  {/* Type majoration */}
                  <div style={{ flex: '1 1 160px' }}>
                    <FieldLabel>Type de majoration</FieldLabel>
                    <select
                      value={form.type_majoration || 'pourcentage'}
                      onChange={e => setForm(p => ({ ...p, type_majoration: e.target.value }))}
                      style={{ ...inputSt, cursor: 'pointer' }}
                    >
                      <option value="pourcentage">Pourcentage (%)</option>
                      <option value="montant_fixe">Montant fixe (F)</option>
                    </select>
                  </div>
                </div>

                {/* Note */}
                <div>
                  <FieldLabel>Note</FieldLabel>
                  <input
                    value={form.note ?? ''}
                    onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                    placeholder="Remarque optionnelle..."
                    style={inputSt}
                    onFocus={e => e.target.style.borderColor = colors.orange}
                    onBlur={e  => e.target.style.borderColor = colors.gray300}
                  />
                </div>

                {/* Info logique fallback */}
                <div style={{
                  padding: '8px 14px', borderRadius: radius.sm,
                  background: colors.infoBg, border: `1px solid ${colors.info}20`,
                }}>
                  <div style={{ fontSize: 10, color: colors.info, lineHeight: 1.5 }}>
                    <strong>Logique de résolution :</strong> Tarif médecin → si absent, tarif hôpital.
                    La majoration s'applique automatiquement les jours fériés.
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{
                padding: '12px 20px', borderTop: `1px solid ${colors.gray200}`,
                background: colors.gray50,
                display: 'flex', gap: 8, justifyContent: 'flex-end',
              }}>
                <button
                  onClick={closePanel}
                  style={{
                    padding: '8px 18px', borderRadius: radius.sm, cursor: 'pointer',
                    border: `1px solid ${colors.gray300}`, background: '#fff',
                    color: colors.gray700, fontSize: 12, fontWeight: 700,
                  }}
                >Annuler</button>
                <button
                  onClick={handleSave}
                  disabled={saving || (panel === 'add' && !form.service_id)}
                  style={{
                    padding: '8px 20px', borderRadius: radius.sm, cursor: 'pointer',
                    border: 'none', background: colors.orange,
                    color: '#fff', fontSize: 12, fontWeight: 700,
                    opacity: (saving || (panel === 'add' && !form.service_id)) ? 0.6 : 1,
                  }}
                >{saving ? 'Enregistrement...' : '✓ Enregistrer'}</button>
              </div>
            </div>
          )}

          {/* Tableau des tarifs du médecin */}
          <div style={{
            background: '#fff', borderRadius: radius.lg, boxShadow: shadows.sm,
            border: `1px solid ${colors.gray200}`, overflow: 'hidden',
          }}>
            {/* En-tête tableau */}
            <div style={{
              background: `linear-gradient(135deg, ${colors.bleu} 0%, #003f7a 100%)`,
              padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16 }}>🧾</span>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>Tarifs personnalisés</span>
                <span style={{
                  background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)',
                  fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: radius.full,
                }}>
                  {tarifsMedecin.length}
                </span>
              </div>
              <button
                onClick={panel === 'add' ? closePanel : openAdd}
                disabled={servicesSansTarif.length === 0 && panel !== 'add'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: radius.sm,
                  border: 'none',
                  background: panel === 'add' ? 'rgba(255,255,255,0.25)' : colors.orange,
                  color: '#fff', fontSize: 11, fontWeight: 700,
                  cursor: (servicesSansTarif.length === 0 && panel !== 'add') ? 'not-allowed' : 'pointer',
                  opacity: (servicesSansTarif.length === 0 && panel !== 'add') ? 0.5 : 1,
                }}
              >
                {panel === 'add' ? '✕ Annuler' : '＋ Ajouter un tarif'}
              </button>
            </div>

            {/* Note fallback */}
            <div style={{
              padding: '8px 18px', background: colors.successBg,
              borderBottom: `1px solid ${colors.success}20`,
              display: 'flex', gap: 8, alignItems: 'center',
            }}>
              <span style={{ fontSize: 13 }}>✅</span>
              <span style={{ fontSize: 11, color: colors.success }}>
                Pour les services non listés ci-dessous, le tarif hôpital s'applique automatiquement.
              </span>
            </div>

            {/* Tableau */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Service', 'Tarif hôpital (réf.)', 'Tarif médecin', 'Majoration fériée', 'Statut', 'Actions'].map((h, i) => (
                      <th key={i} style={{
                        padding: '10px 14px', background: colors.gray50,
                        color: colors.gray600, fontSize: 10, fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                        borderBottom: `2px solid ${colors.gray200}`,
                        textAlign: i >= 2 ? 'right' : 'left', whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tarifsMedecin.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: 30, textAlign: 'center', color: colors.gray500, fontSize: 12 }}>
                        <div style={{ marginBottom: 6, fontSize: 24 }}>📋</div>
                        Aucun tarif personnalisé — le médecin utilise les tarifs hôpital pour tous les services
                      </td>
                    </tr>
                  ) : tarifsMedecin.map((t, i) => (
                    <tr
                      key={t.id}
                      style={{
                        background: editTarif?.id === t.id
                          ? `${colors.orange}08`
                          : i % 2 === 0 ? '#fff' : colors.gray50,
                        borderBottom: `1px solid ${colors.gray100}`,
                        borderLeft: editTarif?.id === t.id
                          ? `3px solid ${colors.orange}`
                          : '3px solid transparent',
                      }}
                    >
                      <td style={{ padding: '11px 14px', fontSize: 12, fontWeight: 700, color: colors.bleu }}>{t.serviceNom}</td>
                      <td style={{ padding: '11px 14px', fontSize: 11, color: colors.gray500, textAlign: 'right' }}>
                        {t.tarifHopital ? Number(t.tarifHopital).toLocaleString('fr-FR') + ' F' : '—'}
                      </td>
                      <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                        {t.prix_service != null
                          ? <span style={{ fontWeight: 700, color: colors.orange }}>{Number(t.prix_service).toLocaleString('fr-FR')} F</span>
                          : <Badge variant="info">Fallback hôpital</Badge>}
                      </td>
                      <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                        {t.majoration_ferie > 0
                          ? <Badge variant="warning">+{t.majoration_ferie}{t.type_majoration === 'pourcentage' ? '%' : ' F'}</Badge>
                          : <span style={{ fontSize: 11, color: colors.gray400 }}>—</span>}
                      </td>
                      <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                        <Badge variant={t.actif ? 'success' : 'danger'}>{t.actif ? 'Actif' : 'Inactif'}</Badge>
                      </td>
                      <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                          <BtnAction
                            label={editTarif?.id === t.id ? '✕' : '✏️'}
                            color={colors.bleu}
                            onClick={() => editTarif?.id === t.id ? closePanel() : openEdit(t)}
                          />
                          <BtnAction
                            label={deleting === t.id ? '...' : '🗑'}
                            color={colors.danger}
                            disabled={deleting === t.id}
                            onClick={() => handleDelete(t)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!medecinId && (
        <div style={{
          background: '#fff', borderRadius: radius.lg, boxShadow: shadows.sm,
          padding: 40, textAlign: 'center', border: `1px solid ${colors.gray200}`,
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👨‍⚕️</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: colors.gray800, marginBottom: 6 }}>
            Sélectionnez un médecin
          </div>
          <div style={{ fontSize: 12, color: colors.gray500 }}>
            Choisissez un médecin ci-dessus pour configurer ses tarifs personnalisés
          </div>
        </div>
      )}
    </div>
  )
}

// ── Petit bouton action ────────────────────────────────────────────────────────
function BtnAction({ label, color, onClick, disabled }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        width: 28, height: 28, borderRadius: radius.sm,
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: `1.5px solid ${color}`,
        background: h && !disabled ? color : `${color}10`,
        color: h && !disabled ? '#fff' : color,
        fontSize: 12, fontWeight: 700, transition: 'all 0.13s',
        opacity: disabled ? 0.5 : 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >{label}</button>
  )
}
