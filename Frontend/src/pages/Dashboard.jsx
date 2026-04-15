import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { hospitalApi, departementApi, serviceApi, personnelApi, patientApi, visiteApi } from '../api'
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

function FilterButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: radius.md,
        border: 'none',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        background: active ? colors.bleu : colors.gray100,
        color: active ? colors.white : colors.gray600,
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )
}

function SimpleBarChart({ data, title, color = colors.bleu }) {
  const max = Math.max(...data.map(d => d.value))
  return (
    <div style={{ background: colors.white, borderRadius: radius.lg, padding: spacing.lg, boxShadow: shadows.sm }}>
      <h3 style={{ margin: '0 0 16px', color: colors.bleu, fontSize: 14, fontWeight: 700 }}>{title}</h3>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
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

function SimpleDonutChart({ data, title }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  let cumulative = 0
  const segments = data.map((d => {
    const pct = (d.value / total) * 100
    const start = cumulative
    cumulative += pct
    return { ...d, pct, start }
  }))
  
  const size = 100
  const stroke = 20
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dashArray = segments.map(s => `${(s.pct / 100) * circumference} ${circumference}`)
  const dashOffset = segments.reduce((acc, s, i) => {
    const offset = i === 0 ? 0 : -segments.slice(0, i).reduce((a, seg) => a + (seg.pct / 100) * circumference, 0)
    return offset
  }, circumference / 4)

  const chartColors = [colors.bleu, colors.orange, colors.success, '#9c27b0', '#00bcd4']

  return (
    <div style={{ background: colors.white, borderRadius: radius.lg, padding: spacing.lg, boxShadow: shadows.sm }}>
      <h3 style={{ margin: '0 0 16px', color: colors.bleu, fontSize: 14, fontWeight: 700 }}>{title}</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 100, height: 100, position: 'relative' }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {segments.map((s, i) => (
              <circle
                key={i}
                cx={size/2}
                cy={size/2}
                r={radius}
                fill="none"
                stroke={chartColors[i % chartColors.length]}
                strokeWidth={stroke}
                strokeDasharray={`${(s.pct / 100) * circumference} ${circumference}`}
                strokeDashoffset={-segments.slice(0, i).reduce((a, seg) => a + (seg.pct / 100) * circumference, 0)}
                transform={`rotate(-90 ${size/2} ${size/2})`}
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
              <div style={{ width: 10, height: 10, borderRadius: 2, background: chartColors[i % chartColors.length] }} />
              <span style={{ color: colors.gray600, flex: 1 }}>{d.label}</span>
              <span style={{ fontWeight: 600, color: colors.gray800 }}>{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function HorizontalBarChart({ data, title, color = colors.orange }) {
  const max = Math.max(...data.map(d => d.value))
  return (
    <div style={{ background: colors.white, borderRadius: radius.lg, padding: spacing.lg, boxShadow: shadows.sm }}>
      <h3 style={{ margin: '0 0 16px', color: colors.bleu, fontSize: 14, fontWeight: 700 }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.slice(0, 10).map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 80, fontSize: 11, color: colors.gray600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {d.label}
            </span>
            <div style={{ flex: 1, height: 16, background: colors.gray100, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${(d.value / max) * 100}%`, height: '100%', background: color, borderRadius: 4 }} />
            </div>
            <span style={{ width: 30, fontSize: 11, fontWeight: 600, color: colors.gray700, textAlign: 'right' }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LineChart({ data, title }) {
  const max = Math.max(...data.map(d => Math.max(d.percu, d.recu)))
  const pointsPercu = data.map((d, i) => `${i * 50 + 25},${80 - (d.percu / max) * 70}`)
  const pointsRecu = data.map((d, i) => `${i * 50 + 25},${80 - (d.recu / max) * 70}`)
  
  return (
    <div style={{ background: colors.white, borderRadius: radius.lg, padding: spacing.lg, boxShadow: shadows.sm }}>
      <h3 style={{ margin: '0 0 16px', color: colors.bleu, fontSize: 14, fontWeight: 700 }}>{title}</h3>
      <div style={{ position: 'relative', height: 150 }}>
        <svg width="100%" height="150" viewBox="0 0 350 150" preserveAspectRatio="none">
          <line x1="25" y1="80" x2="325" y2="80" stroke={colors.gray200} strokeWidth="1" />
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
            <text key={i} x="10" y={80 - p * 70} fontSize="9" fill={colors.gray400}>
              {Math.round(max * p).toLocaleString()}
            </text>
          ))}
          <polyline fill="none" stroke={colors.bleu} strokeWidth="2" points={pointsPercu.join(' ')} />
          <polyline fill="none" stroke={colors.success} strokeWidth="2" points={pointsRecu.join(' ')} />
          {data.map((d, i) => (
            <text key={i} x={i * 50 + 25} y="140" fontSize="10" fill={colors.gray500} textAnchor="middle">{d.label}</text>
          ))}
        </svg>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 3, background: colors.bleu, borderRadius: 2 }} />
            <span style={{ fontSize: 11, color: colors.gray600 }}>Montant perçu</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 3, background: colors.success, borderRadius: 2 }} />
            <span style={{ fontSize: 11, color: colors.gray600 }}>Montant reçu</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({ 
    hospitals: 0, departements: 0, services: 0, personnels: 0,
    patients: 0, consultations: 0, rendezvous: 0,
    montantPercu: 0, montantRecu: 0,
  })
  const [loading, setLoading] = useState(true)
  const [filterPeriod, setFilterPeriod] = useState('month')
  const [selectedYear, setSelectedYear] = useState(2026)
  const [dateRange, setDateRange] = useState({ start: '2026-04-01', end: '2026-04-15' })

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)
  const months = [
    { value: 1, label: 'Jan' }, { value: 2, label: 'Fév' }, { value: 3, label: 'Mars' },
    { value: 4, label: 'Avr' }, { value: 5, label: 'Mai' }, { value: 6, label: 'Juin' },
    { value: 7, label: 'Juil' }, { value: 8, label: 'Août' }, { value: 9, label: 'Sept' },
    { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Déc' },
  ]

  useEffect(() => {
    loadStats()
  }, [filterPeriod, selectedYear, dateRange])

  const loadStats = async () => {
    setLoading(true)
    try {
      const [h, d, s, p, pat] = await Promise.all([
        hospitalApi.liste().catch(() => ({ data: { data: [] } })),
        departementApi.liste().catch(() => ({ data: { data: [] } })),
        serviceApi.liste().catch(() => ({ data: { data: [] } })),
        personnelApi.liste().catch(() => ({ data: { data: { total: 0 } } })),
        patientApi.liste({ per_page: 1 }).catch(() => ({ data: { data: { total: 0 } } })),
      ])

      setStats({
        hospitals: h.data?.data?.length ?? 0,
        departements: d.data?.data?.length ?? 0,
        services: s.data?.data?.length ?? 0,
        personnels: p.data?.data?.total ?? p.data?.data?.length ?? 0,
        patients: pat.data?.data?.total ?? 0,
        consultations: 3,
        rendezvous: 2,
        montantPercu: 8500000,
        montantRecu: 7200000,
      })
    } catch (err) {
      console.error('Error loading stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const patientParMois = [
    { label: 'Jan', value: 45 },
    { label: 'Fév', value: 52 },
    { label: 'Mar', value: 48 },
    { label: 'Avr', value: 38 },
  ]

  const consultationParAge = [
    { label: 'Adultes', value: 80 },
    { label: 'Enfance', value: 20 },
  ]

  const topBilans = [
    { label: 'NFS', value: 45 },
    { label: 'Glycémie', value: 38 },
    { label: 'Créatinine', value: 32 },
    { label: 'Bilan hépatique', value: 28 },
    { label: 'TP/INR', value: 24 },
    { label: 'ECBU', value: 20 },
    { label: 'Sérologie', value: 18 },
    { label: 'Ionogramme', value: 15 },
    { label: 'Lipidique', value: 12 },
    { label: 'TSH', value: 10 },
  ]

  const topImageries = [
    { label: 'Radiographie Thorax', value: 35 },
    { label: 'Échographie', value: 28 },
    { label: 'Scanner', value: 22 },
    { label: 'IRM', value: 18 },
    { label: 'ECG', value: 15 },
    { label: 'Mammographie', value: 12 },
    { label: 'Doppler', value: 10 },
    { label: 'Panoramique', value: 8 },
    { label: 'Scanner cerebral', value: 6 },
    { label: 'Ostéodensitométrie', value: 4 },
  ]

  const topMedicaments = [
    { label: 'Paracétamol', value: 120 },
    { label: 'Amoxicilline', value: 95 },
    { label: 'Ibuprofène', value: 88 },
    { label: 'Metronidazole', value: 72 },
    { label: 'Ciprofloxacine', value: 65 },
    { label: 'Oméprazole', value: 58 },
    { label: 'Captopril', value: 52 },
    { label: 'Metformin', value: 48 },
    { label: 'Atorvastatin', value: 42 },
    { label: 'Aspirin', value: 38 },
  ]

  const revenusParMois = [
    { label: 'Jan', percu: 2500000, recu: 2200000 },
    { label: 'Fév', percu: 2800000, recu: 2400000 },
    { label: 'Mar', percu: 2200000, recu: 1800000 },
    { label: 'Avr', percu: 1000000, recu: 800000 },
  ]

  return (
    <div>
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
            Mois en cours : Avril 2026
          </p>
        </div>
        <div style={{ fontSize: 56, opacity: 0.25 }}>🏥</div>
      </div>

      <div style={{
        background: colors.white,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginBottom: 24,
        boxShadow: shadows.sm,
        display: 'flex', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: colors.bleu }}>Filtrer par:</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <FilterButton label="Mois" active={filterPeriod === 'month'} onClick={() => setFilterPeriod('month')} />
          <FilterButton label="Année" active={filterPeriod === 'year'} onClick={() => setFilterPeriod('year')} />
          <FilterButton label="Plage dates" active={filterPeriod === 'range'} onClick={() => setFilterPeriod('range')} />
        </div>

        {filterPeriod === 'year' && (
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            style={{ padding: '8px 12px', borderRadius: radius.sm, border: `1.5px solid ${colors.gray300}`, fontSize: 13 }}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}

        {filterPeriod === 'range' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="date"
              value={dateRange.start}
              onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
              style={{ padding: '6px 10px', borderRadius: radius.sm, border: `1.5px solid ${colors.gray300}`, fontSize: 12 }}
            />
            <span style={{ color: colors.gray400 }}>→</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
              style={{ padding: '6px 10px', borderRadius: radius.sm, border: `1.5px solid ${colors.gray300}`, fontSize: 12 }}
            />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <StatCard icon="🧑‍🤝‍🧑" label="Patients enregistrés" value={stats.patients} color="#e91e63" loading={loading} />
        <StatCard icon="🩺" label="Consultations" value={stats.consultations} color={colors.bleu} loading={loading} />
        <StatCard icon="📅" label="Rendez-vous" value={stats.rendezvous} color={colors.orange} loading={loading} />
        <StatCard icon="💰" label="Montant perçu" value={(stats.montantPercu / 1000000).toFixed(1) + 'M'} subValue="F CFA" color={colors.success} loading={loading} />
        <StatCard icon="✅" label="Montant reçu" value={(stats.montantRecu / 1000000).toFixed(1) + 'M'} subValue="F CFA" color="#6c3fc5" loading={loading} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
        <SimpleBarChart data={patientParMois} title="Patients visités par mois" color={colors.bleu} />
        <SimpleDonutChart data={consultationParAge} title="Consultations par catégorie d'âge" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
        <HorizontalBarChart data={topBilans} title="Top 10 Bilans de laboratoire" color={colors.bleu} />
        <HorizontalBarChart data={topImageries} title="Top 10 Imageries" color={colors.orange} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
        <HorizontalBarChart data={topMedicaments} title="Top 10 Médicaments prescrits" color={colors.success} />
        <LineChart data={revenusParMois} title="Courbe de revenus (Montant perçu/reçu)" />
      </div>
    </div>
  )
}