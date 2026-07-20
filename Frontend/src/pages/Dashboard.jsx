import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { dashboardApi } from '../api'
import { colors, radius, shadows, spacing } from '../theme'
import Spinner from '../components/ui/Spinner'

function StatCard({ icon, label, value, color, subValue, to, loading }) {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => to && navigate(to)}
      style={{
        background: colors.white,
        borderRadius: radius.lg,
        padding: '20px 24px',
        boxShadow: shadows.sm,
        display: 'flex', alignItems: 'center', gap: 16,
        cursor: to ? 'pointer' : 'default',
        borderLeft: `5px solid ${color}`,
        transition: 'transform 0.18s, box-shadow 0.18s',
        flex: 1, minWidth: 160,
      }}
      onMouseEnter={e => {
        if (to) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = shadows.md
        }
      }}
      onMouseLeave={e => {
        if (to) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = shadows.sm
        }
      }}
    >
      <div style={{
        width: 50, height: 50, borderRadius: radius.md,
        background: `${color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 12, color: colors.gray500, fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: colors.gray900, lineHeight: 1.2 }}>
          {loading ? <Spinner size={20} color={color} /> : value}
        </div>
        {subValue && (
          <div style={{ fontSize: 11, color: colors.gray400, marginTop: 2 }}>{subValue}</div>
        )}
      </div>
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 16px', color: colors.gray400, fontSize: 13 }}>
      {message}
    </div>
  )
}

function SimpleBarChart({ data, title, color = colors.bleu }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ background: colors.white, borderRadius: radius.lg, padding: spacing.lg, boxShadow: shadows.sm }}>
        <h3 style={{ margin: '0 0 16px', color: colors.bleu, fontSize: 14, fontWeight: 700 }}>{title}</h3>
        <EmptyState message="Aucune donnée disponible" />
      </div>
    )
  }
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ background: colors.white, borderRadius: radius.lg, padding: spacing.lg, boxShadow: shadows.sm }}>
      <h3 style={{ margin: '0 0 16px', color: colors.bleu, fontSize: 14, fontWeight: 700 }}>{title}</h3>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 10, color: colors.gray600, fontWeight: 600 }}>{d.value || 0}</span>
            <div style={{
              width: '100%',
              height: `${(d.value / max) * 80}px`,
              background: color,
              borderRadius: '4px 4px 0 0',
              minHeight: 4,
            }} />
            <span style={{ fontSize: 10, color: colors.gray500 }}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function HorizontalBarChart({ data, title, color = colors.orange }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ background: colors.white, borderRadius: radius.lg, padding: spacing.lg, boxShadow: shadows.sm }}>
        <h3 style={{ margin: '0 0 16px', color: colors.bleu, fontSize: 14, fontWeight: 700 }}>{title}</h3>
        <EmptyState message="Aucune donnée disponible" />
      </div>
    )
  }
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ background: colors.white, borderRadius: radius.lg, padding: spacing.lg, boxShadow: shadows.sm }}>
      <h3 style={{ margin: '0 0 16px', color: colors.bleu, fontSize: 14, fontWeight: 700 }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.slice(0, 10).map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 120, fontSize: 11, color: colors.gray600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {d.label}
            </span>
            <div style={{ flex: 1, height: 16, background: colors.gray100, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${(d.value / max) * 100}%`, height: '100%', background: color, borderRadius: 4 }} />
            </div>
            <span style={{ width: 36, fontSize: 11, fontWeight: 600, color: colors.gray700, textAlign: 'right' }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DonutRdv({ data, title }) {
  const chartColors = [colors.success, colors.orange, '#e91e63', colors.bleu, colors.gray400]
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) {
    return (
      <div style={{ background: colors.white, borderRadius: radius.lg, padding: spacing.lg, boxShadow: shadows.sm }}>
        <h3 style={{ margin: '0 0 16px', color: colors.bleu, fontSize: 14, fontWeight: 700 }}>{title}</h3>
        <EmptyState message="Aucune donnée disponible" />
      </div>
    )
  }
  const size = 100
  const stroke = 20
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  let cum = 0
  const segments = data.map(d => {
    const pct = (d.value / total) * 100
    const offset = -cum / 100 * circ
    cum += pct
    return { ...d, pct, offset }
  })
  return (
    <div style={{ background: colors.white, borderRadius: radius.lg, padding: spacing.lg, boxShadow: shadows.sm }}>
      <h3 style={{ margin: '0 0 16px', color: colors.bleu, fontSize: 14, fontWeight: 700 }}>{title}</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flexShrink: 0 }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {segments.map((s, i) => (
              <circle
                key={i}
                cx={size / 2} cy={size / 2} r={r}
                fill="none"
                stroke={chartColors[i % chartColors.length]}
                strokeWidth={stroke}
                strokeDasharray={`${(s.pct / 100) * circ} ${circ}`}
                strokeDashoffset={s.offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            ))}
            <text x="50%" y="50%" textAnchor="middle" dy="0.3em" fontSize="14" fontWeight="800" fill={colors.gray700}>
              {total}
            </text>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          {data.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 11 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: chartColors[i % chartColors.length], flexShrink: 0 }} />
              <span style={{ color: colors.gray600, flex: 1 }}>{d.label}</span>
              <span style={{ fontWeight: 600, color: colors.gray800 }}>{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function formatMontant(v) {
  if (!v && v !== 0) return '—'
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M'
  if (v >= 1_000) return (v / 1_000).toFixed(0) + 'k'
  return String(v)
}

function currentMonthLabel() {
  return new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    dashboardApi.stats()
      .then(res => setData(res.data?.data ?? null))
      .catch(() => setError('Impossible de charger les statistiques.'))
      .finally(() => setLoading(false))
  }, [])

  const visitesMois = data?.visites_par_mois?.map(r => ({
    label: r.label,
    value: Number(r.total),
  })) ?? []

  const visitesParDept = data?.visites_par_dept?.map(r => ({
    label: r.label,
    value: Number(r.total),
  })) ?? []

  const rdvParStatut = data?.rdv_par_statut?.map(r => ({
    label: r.statut,
    value: Number(r.total),
  })) ?? []

  return (
    <div>
      {/* En-tête */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.bleu} 0%, ${colors.bleuLight} 100%)`,
        borderRadius: radius.lg,
        padding: '24px 28px',
        marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: shadows.md,
      }}>
        <div>
          <h1 style={{ margin: 0, color: colors.white, fontSize: 24, fontWeight: 800 }}>
            Tableau de bord <span style={{ color: colors.orange }}>SenMed</span>
          </h1>
          <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
            {currentMonthLabel()}
          </p>
        </div>
        <div style={{ fontSize: 56, opacity: 0.25 }}>🏥</div>
      </div>

      {error && (
        <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: radius.md, padding: '12px 16px', marginBottom: 16, color: '#856404', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Cartes stats principales */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <StatCard icon="🧑‍🤝‍🧑" label="Patients" value={data?.patients ?? '—'} color="#e91e63" to="/patients" loading={loading} />
        <StatCard icon="🩺" label="Visites" value={data?.visites ?? '—'} color={colors.bleu} to="/visites" loading={loading}
          subValue={data ? `${data.visites_mois} ce mois` : undefined} />
        <StatCard icon="📅" label="Rendez-vous" value={data?.rdv ?? '—'} color={colors.orange} to="/rendez-vous" loading={loading} />
        <StatCard icon="💰" label="Montant facturé" value={loading ? '—' : formatMontant(data?.montant_total)} subValue="F CFA" color={colors.success} loading={loading} />
        <StatCard icon="✅" label="Montant payé" value={loading ? '—' : formatMontant(data?.montant_paye)} subValue="F CFA" color="#6c3fc5" loading={loading} />
      </div>

      {/* Ligne 2 : Cartes secondaires */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <StatCard icon="👥" label="Personnels" value={data?.personnels ?? '—'} color="#009688" to="/personnels" loading={loading} />
        <StatCard icon="🏢" label="Départements" value={data?.departements ?? '—'} color="#607d8b" to="/departements" loading={loading} />
        <StatCard icon="🔬" label="Services" value={data?.services ?? '—'} color="#795548" to="/services" loading={loading} />
        <StatCard icon="⏳" label="En attente" value={loading ? '—' : formatMontant(data?.montant_en_attente)} subValue="F CFA" color={colors.orange} loading={loading} />
      </div>

      {/* Graphiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 16 }}>
        <SimpleBarChart
          data={visitesMois}
          title="Visites des 6 derniers mois"
          color={colors.bleu}
        />
        <DonutRdv
          data={rdvParStatut}
          title="Rendez-vous par statut"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 16 }}>
        <HorizontalBarChart
          data={visitesParDept}
          title="Visites par département (Top 10)"
          color={colors.orange}
        />
      </div>
    </div>
  )
}
