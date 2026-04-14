import { useCallback, useEffect, useRef, useState } from 'react'
import { salleAttenteApi } from '../../api'
import { colors, radius, shadows, spacing } from '../../theme'
import { showToast } from '../../components/ui/Toast'

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmtDate  = d => d ? new Date(d).toLocaleDateString('fr-FR') : null
const fmtHeure = d => d ? new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'
const fmtDateInput = d => d ? new Date(d).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
const todayStr = () => new Date().toISOString().split('T')[0]

const ATTENTE_COLOR  = '#f57c00'
const ATTENTE_BG     = '#fff3e0'
const VU_COLOR       = '#2e7d32'
const VU_BG          = '#e8f5e9'
const URGENCE_COLOR  = '#c62828'
const URGENCE_BG     = '#fdecea'

// ─── Composant carte patient ─────────────────────────────────────────────────

function PatientCard({ visite }) {
  const { patient, medecin } = visite
  const estVu       = visite.doctor_seen === 1
  const estUrgence  = visite.urgence
  const initiales   = patient
    ? ((patient.first_name?.[0] ?? '') + (patient.last_name?.[0] ?? '')).toUpperCase()
    : '?'

  const statusColor = estVu ? VU_COLOR  : estUrgence ? URGENCE_COLOR : ATTENTE_COLOR
  const statusBg    = estVu ? VU_BG     : estUrgence ? URGENCE_BG    : ATTENTE_BG
  const statusLabel = estVu ? 'Vu'      : estUrgence ? 'Urgence'     : 'En attente'

  const nomMedecin  = medecin
    ? (medecin.staff_name || `${medecin.first_name || ''} ${medecin.last_name || ''}`.trim() || medecin.user_id || '—')
    : (visite.consulting_doctor_id || '—')

  const rdv = visite.date ? fmtDate(visite.date) : null

  return (
    <div style={{
      background: colors.white,
      borderRadius: radius.lg,
      boxShadow: estVu ? shadows.sm : shadows.md,
      border: `2px solid ${estVu ? colors.gray200 : estUrgence ? URGENCE_COLOR + '60' : ATTENTE_COLOR + '40'}`,
      padding: '16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      opacity: estVu ? 0.72 : 1,
      transition: 'all 0.25s ease',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Bande colorée en haut */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 4,
        background: statusColor,
        borderRadius: `${radius.lg} ${radius.lg} 0 0`,
      }} />

      {/* En-tête : photo + info + badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginTop: 6 }}>
        {/* Avatar */}
        <div style={{
          width: 58, height: 58,
          borderRadius: '50%',
          background: estVu
            ? `linear-gradient(135deg, ${VU_COLOR}22, ${VU_COLOR}44)`
            : estUrgence
              ? `linear-gradient(135deg, ${URGENCE_COLOR}22, ${URGENCE_COLOR}44)`
              : `linear-gradient(135deg, ${colors.bleu}22, ${colors.bleu}44)`,
          border: `3px solid ${statusColor}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          {patient?.photo ? (
            <img src={patient.photo} alt="photo"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 20, fontWeight: 800, color: statusColor }}>
              {initiales}
            </span>
          )}
        </div>

        {/* Nom + code */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 15, fontWeight: 800,
            color: colors.gray900,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {patient?.first_name} {patient?.last_name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 10, fontWeight: 700,
              background: colors.bleu + '15',
              color: colors.bleu,
              padding: '2px 8px', borderRadius: 20,
              letterSpacing: '0.3px',
            }}>
              {patient?.patient_code ?? patient?.patient_id ?? '—'}
            </span>
            {estUrgence && (
              <span style={{
                fontSize: 10, fontWeight: 700,
                background: URGENCE_BG, color: URGENCE_COLOR,
                padding: '2px 8px', borderRadius: 20,
              }}>🚨 Urgence</span>
            )}
          </div>
        </div>

        {/* Badge statut */}
        <span style={{
          fontSize: 11, fontWeight: 700,
          background: statusBg, color: statusColor,
          padding: '4px 10px', borderRadius: 20,
          flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: statusColor, display: 'inline-block',
          }} />
          {statusLabel}
        </span>
      </div>

      {/* Ligne séparatrice */}
      <div style={{ height: 1, background: colors.gray100 }} />

      {/* Détails */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px' }}>
        <InfoLine icon="🩺" label="Médecin" value={nomMedecin} />
        <InfoLine icon="🕐" label="Arrivée" value={fmtHeure(visite.created_dttm)} />
        <InfoLine icon="🏥" label="Type" value={visite.visit_type ?? '—'} />
        {rdv ? (
          <InfoLine icon="📅" label="RDV" value={rdv} highlight />
        ) : (
          <InfoLine icon="📅" label="RDV" value="—" />
        )}
      </div>

      {/* Prise en charge */}
      {(visite.prise_en_charge || visite.ID_Compagny) && (
        <div style={{
          fontSize: 11, color: colors.info,
          background: colors.infoBg,
          borderRadius: radius.sm,
          padding: '4px 10px',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span>🛡</span>
          <span>Prise en charge{visite.ID_Compagny ? ` · ${visite.ID_Compagny}` : ''}</span>
        </div>
      )}

      {estVu && (
        <div style={{
          textAlign: 'center', fontSize: 12, fontWeight: 600,
          color: VU_COLOR,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <span>✓</span> Consultation terminée
        </div>
      )}
    </div>
  )
}

function InfoLine({ icon, label, value, highlight }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
      <span style={{ fontSize: 12, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: colors.gray500, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
          {label}
        </div>
        <div style={{
          fontSize: 12, fontWeight: highlight ? 700 : 500,
          color: highlight ? ATTENTE_COLOR : colors.gray800,
        }}>
          {value}
        </div>
      </div>
    </div>
  )
}

// ─── Compteur animé ──────────────────────────────────────────────────────────

function StatBubble({ count, label, color, bg, icon }) {
  return (
    <div style={{
      background: bg,
      borderRadius: radius.lg,
      padding: '14px 20px',
      display: 'flex', alignItems: 'center', gap: 14,
      flex: 1, minWidth: 130,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: radius.md,
        background: color + '20',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>{count}</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: color + 'cc', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
      </div>
    </div>
  )
}

// ─── Page principale ─────────────────────────────────────────────────────────

export default function SalleAttentePage() {
  const [visites,    setVisites]    = useState([])
  const [meta,       setMeta]       = useState({ total: 0, en_attente: 0, vus: 0 })
  const [loading,    setLoading]    = useState(true)
  const [statut,     setStatut]     = useState('all')    // 'all' | '0' | '1'
  const [priorite,   setPriorite]   = useState('all')    // 'all' | 'urgence' | 'normal' | 'hospitalisation'
  const [date,       setDate]       = useState(todayStr())
  const [search,     setSearch]     = useState('')

  const timer     = useRef(null)
  const autoTimer = useRef(null)

  // ── Chargement ──────────────────────────────────────────
  const charger = useCallback(async (params = {}) => {
    setLoading(true)
    try {
      const res = await salleAttenteApi.liste({
        statut,
        priorite,
        date,
        search: search || undefined,
        ...params,
      })
      setVisites(res.data.data ?? [])
      setMeta(res.data.meta ?? { total: 0, en_attente: 0, vus: 0 })
    } catch {
      showToast('Erreur lors du chargement de la salle d\'attente.', 'error')
    } finally {
      setLoading(false)
    }
  }, [statut, priorite, date, search])

  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => charger(), 300)
    return () => clearTimeout(timer.current)
  }, [charger])

  // Auto-refresh toutes les 30 secondes
  useEffect(() => {
    autoTimer.current = setInterval(() => charger(), 30_000)
    return () => clearInterval(autoTimer.current)
  }, [charger])

  // ── Render ───────────────────────────────────────────────
  const filtresBtns = [
    { key: 'all', label: 'Tous',       count: meta.total,      color: colors.bleu,   bg: colors.infoBg },
    { key: '0',   label: 'En attente', count: meta.en_attente, color: ATTENTE_COLOR, bg: ATTENTE_BG    },
    { key: '1',   label: 'Vus',        count: meta.vus,        color: VU_COLOR,      bg: VU_BG         },
  ]

  const prioriteBtns = [
    { key: 'all',             label: 'Toutes priorités',  count: meta.total,             color: colors.bleu,  bg: colors.infoBg, icon: '🏷' },
    { key: 'urgence',         label: 'Urgence',           count: meta.urgences ?? 0,     color: URGENCE_COLOR, bg: URGENCE_BG,   icon: '🚨' },
    { key: 'normal',          label: 'Normal',            count: meta.normaux ?? 0,      color: VU_COLOR,      bg: VU_BG,        icon: '✅' },
    { key: 'hospitalisation', label: 'Hospitalisation',   count: meta.hospitalisations ?? 0, color: '#6a1b9a', bg: '#f3e5f5',   icon: '🛏' },
  ]

  return (
    <div style={{ padding: '24px 28px', minHeight: '100vh', background: '#f4f6fa' }}>

      {/* ── En-tête ─────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16, marginBottom: 24,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: radius.md,
              background: `linear-gradient(135deg, ${colors.bleu}, ${colors.bleuLight})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, boxShadow: `0 4px 12px ${colors.bleu}40`,
            }}>🏥</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: colors.gray900 }}>
                Salle d'Attente
              </h1>
              <div style={{ fontSize: 12, color: colors.gray500, marginTop: 2 }}>
                {fmtDate(date)} · Mise à jour auto toutes les 30s
              </div>
            </div>
          </div>
        </div>

        {/* Rafraîchir manuellement */}
        <button
          onClick={() => charger()}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px',
            border: `1.5px solid ${colors.gray300}`,
            borderRadius: radius.md,
            background: colors.white,
            color: colors.gray700,
            fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
            boxShadow: shadows.sm,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = colors.gray50 }}
          onMouseLeave={e => { e.currentTarget.style.background = colors.white }}
        >
          🔄 Actualiser
        </button>
      </div>

      {/* ── Statistiques ────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
        <StatBubble count={meta.total}            label="Total"          color={colors.bleu}   bg={colors.infoBg}  icon="📋" />
        <StatBubble count={meta.en_attente}       label="En attente"     color={ATTENTE_COLOR} bg={ATTENTE_BG}     icon="⏳" />
        <StatBubble count={meta.vus}              label="Vus"            color={VU_COLOR}      bg={VU_BG}          icon="✅" />
        <StatBubble count={meta.urgences ?? 0}    label="Urgences"       color={URGENCE_COLOR} bg={URGENCE_BG}     icon="🚨" />
        <StatBubble count={meta.hospitalisations ?? 0} label="Hospitalisés" color="#6a1b9a"   bg="#f3e5f5"        icon="🛏" />
      </div>

      {/* ── Filtres et recherche ─────────────────────────── */}
      <div style={{
        background: colors.white,
        borderRadius: radius.lg,
        padding: '16px 20px',
        boxShadow: shadows.sm,
        marginBottom: 20,
        display: 'flex', alignItems: 'center',
        gap: 14, flexWrap: 'wrap',
      }}>
        {/* Champ date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: colors.gray600, whiteSpace: 'nowrap' }}>
            📅 Date
          </span>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{
              border: `1.5px solid ${colors.gray300}`,
              borderRadius: radius.sm,
              padding: '8px 10px',
              fontSize: 13, color: colors.gray900,
              background: colors.white, outline: 'none',
              cursor: 'pointer',
            }}
          />
        </div>

        <div style={{ width: 1, height: 32, background: colors.gray200, flexShrink: 0 }} />

        {/* Recherche patient */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            fontSize: 14, color: colors.gray400, pointerEvents: 'none',
          }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un patient (nom, code…)"
            style={{
              width: '100%', boxSizing: 'border-box',
              border: `1.5px solid ${colors.gray300}`,
              borderRadius: radius.sm,
              padding: '8px 10px 8px 32px',
              fontSize: 13, color: colors.gray900,
              background: colors.white, outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => { e.target.style.borderColor = colors.bleu }}
            onBlur={e => { e.target.style.borderColor = colors.gray300 }}
          />
        </div>

        {search && (
          <button onClick={() => setSearch('')}
            style={{
              border: 'none', background: 'none',
              color: colors.gray500, cursor: 'pointer', fontSize: 13,
              padding: '4px 8px',
            }}>
            ✕ Effacer
          </button>
        )}
      </div>

      {/* ── Tabs filtre statut + priorité (même ligne) ──── */}
      <div style={{
        background: colors.white,
        borderRadius: radius.lg,
        padding: '12px 18px',
        boxShadow: shadows.sm,
        marginBottom: 20,
        display: 'flex', alignItems: 'center',
        gap: 8, flexWrap: 'wrap',
      }}>
        {/* Statut */}
        <span style={{ fontSize: 11, fontWeight: 700, color: colors.gray400, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Statut</span>
        {filtresBtns.map(f => (
          <button key={f.key} onClick={() => setStatut(f.key)} style={{
            padding: '6px 14px', borderRadius: radius.full,
            border: `2px solid ${statut === f.key ? f.color : colors.gray200}`,
            background: statut === f.key ? f.bg : colors.white,
            color: statut === f.key ? f.color : colors.gray600,
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.15s',
            boxShadow: statut === f.key ? `0 2px 6px ${f.color}30` : 'none',
          }}>
            <span style={{
              minWidth: 18, height: 18, borderRadius: '50%',
              background: statut === f.key ? f.color : colors.gray200,
              color: statut === f.key ? colors.white : colors.gray600,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 800,
            }}>{f.count}</span>
            {f.label}
          </button>
        ))}

        {/* Séparateur vertical */}
        <div style={{ width: 1, height: 24, background: colors.gray200, flexShrink: 0, margin: '0 4px' }} />

        {/* Priorité */}
        <span style={{ fontSize: 11, fontWeight: 700, color: colors.gray400, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Priorité</span>
        {prioriteBtns.map(f => (
          <button key={f.key} onClick={() => setPriorite(f.key)} style={{
            padding: '6px 14px', borderRadius: radius.full,
            border: `2px solid ${priorite === f.key ? f.color : colors.gray200}`,
            background: priorite === f.key ? f.bg : colors.white,
            color: priorite === f.key ? f.color : colors.gray600,
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.15s',
            boxShadow: priorite === f.key ? `0 2px 6px ${f.color}30` : 'none',
          }}>
            <span style={{ fontSize: 12 }}>{f.icon}</span>
            {f.label}
            <span style={{
              minWidth: 18, height: 18, borderRadius: '50%',
              background: priorite === f.key ? f.color : colors.gray200,
              color: priorite === f.key ? colors.white : colors.gray600,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 800,
            }}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* ── Grille des cartes ────────────────────────────── */}
      {loading ? (
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          height: 200, gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: `3px solid ${colors.bleu}30`,
            borderTop: `3px solid ${colors.bleu}`,
            animation: 'spin 0.8s linear infinite',
          }} />
          <span style={{ color: colors.gray500, fontSize: 14 }}>Chargement…</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : visites.length === 0 ? (
        <div style={{
          background: colors.white,
          borderRadius: radius.lg,
          padding: '60px 20px',
          textAlign: 'center',
          boxShadow: shadows.sm,
        }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🪑</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: colors.gray700, marginBottom: 8 }}>
            {statut === '0' ? 'Aucun patient en attente' :
             statut === '1' ? 'Aucun patient vu' :
             'Aucune visite pour cette journée'}
          </div>
          <div style={{ fontSize: 13, color: colors.gray400 }}>
            {date === todayStr()
              ? 'Les nouvelles visites apparaîtront ici automatiquement.'
              : `Aucune visite enregistrée le ${fmtDate(date)}.`}
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16,
        }}>
          {visites.map(v => (
            <PatientCard
              key={v.adt_id}
              visite={v}
            />
          ))}
        </div>
      )}
    </div>
  )
}
