import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { hospitalApi, departementApi, serviceApi, personnelApi, patientApi } from '../api'
import { colors, radius, shadows, spacing } from '../theme'
import Spinner from '../components/ui/Spinner'

function StatCard({ icon, label, value, color, subValue, to, loading }) {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => navigate(to)}
      style={{
        background: colors.white,
        borderRadius: radius.lg,
        padding: '20px 24px',
        boxShadow: shadows.sm,
        display: 'flex', alignItems: 'center', gap: 16,
        cursor: 'pointer',
        borderLeft: `5px solid ${color}`,
        transition: 'transform 0.18s, box-shadow 0.18s',
        flex: 1, minWidth: 180,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = shadows.md
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = shadows.sm
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

function FilterSelect({ label, value, options, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
      <span style={{ fontSize: 13, color: colors.gray600, fontWeight: 500 }}>{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          padding: '8px 12px',
          borderRadius: radius.sm,
          border: `1.5px solid ${colors.gray300}`,
          fontSize: 13,
          color: colors.gray900,
          background: colors.white,
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({ 
    hospitals: 0, 
    departements: 0, 
    services: 0, 
    personnels: 0,
    patients: 0,
    patientsToday: 0,
    patientsWeek: 0,
    patientsMonth: 0,
  })
  const [loading, setLoading] = useState(true)
  
  const [filterPeriod, setFilterPeriod] = useState('all')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)
  const months = [
    { value: 1, label: 'Janvier' }, { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' }, { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' }, { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' }, { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' }, { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' }, { value: 12, label: 'Décembre' },
  ]

  useEffect(() => {
    loadStats()
  }, [filterPeriod, selectedYear, selectedMonth])

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
        patientsToday: pat.data?.data?.total ?? 0,
        patientsWeek: pat.data?.data?.total ?? 0,
        patientsMonth: pat.data?.data?.total ?? 0,
      })
    } catch (err) {
      console.error('Error loading stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const getPatientStats = () => {
    switch (filterPeriod) {
      case 'today':
        return { value: stats.patientsToday, label: "aujourd'hui" }
      case 'week':
        return { value: stats.patientsWeek, label: 'cette semaine' }
      case 'month':
        return { value: stats.patientsMonth, label: 'ce mois' }
      case 'year':
        return { value: stats.patients, label: `en ${selectedYear}` }
      case 'monthly':
        return { value: stats.patients, label: `en ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}` }
      default:
        return { value: stats.patients, label: 'total' }
    }
  }

  const patientStats = getPatientStats()

  return (
    <div>
      {/* Welcome banner */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.bleu} 0%, ${colors.bleuLight} 100%)`,
        borderRadius: radius.lg,
        padding: '24px 28px',
        marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: shadows.md,
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', right: -30, top: -30,
          width: 160, height: 160, borderRadius: '50%',
          background: 'rgba(255,118,49,0.12)',
        }} />
        <div>
          <h1 style={{ margin: 0, color: colors.white, fontSize: 24, fontWeight: 800 }}>
            Tableau de bord <span style={{ color: colors.orange }}>SenMed</span>
          </h1>
          <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div style={{ fontSize: 56, opacity: 0.25 }}>🏥</div>
      </div>

      {/* Filters */}
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
          <FilterButton label="Tout" active={filterPeriod === 'all'} onClick={() => setFilterPeriod('all')} />
          <FilterButton label="Aujourd'hui" active={filterPeriod === 'today'} onClick={() => setFilterPeriod('today')} />
          <FilterButton label="Semaine" active={filterPeriod === 'week'} onClick={() => setFilterPeriod('week')} />
          <FilterButton label="Mois" active={filterPeriod === 'month'} onClick={() => setFilterPeriod('month')} />
          <FilterButton label="Année" active={filterPeriod === 'year'} onClick={() => setFilterPeriod('year')} />
          <FilterButton label="Mois sp." active={filterPeriod === 'monthly'} onClick={() => setFilterPeriod('monthly')} />
        </div>

        {filterPeriod === 'year' && (
          <FilterSelect 
            label="Année:" 
            value={selectedYear} 
            options={years.map(y => ({ value: y, label: y.toString() }))}
            onChange={setSelectedYear}
          />
        )}

        {filterPeriod === 'monthly' && (
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <FilterSelect 
              label="Mois:" 
              value={selectedMonth} 
              options={months}
              onChange={setSelectedMonth}
            />
            <FilterSelect 
              label="Année:" 
              value={selectedYear} 
              options={years.map(y => ({ value: y, label: y.toString() }))}
              onChange={setSelectedYear}
            />
          </div>
        )}

        <div style={{ marginLeft: 'auto', fontSize: 12, color: colors.gray500 }}>
          Période: <strong style={{ color: colors.bleu }}>
            {filterPeriod === 'all' && 'Tous les temps'}
            {filterPeriod === 'today' && "Aujourd'hui"}
            {filterPeriod === 'week' && 'Cette semaine'}
            {filterPeriod === 'month' && 'Ce mois'}
            {filterPeriod === 'year' && selectedYear}
            {filterPeriod === 'monthly' && `${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`}
          </strong>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <StatCard 
          icon="🏥" 
          label="Hôpitaux" 
          value={stats.hospitals} 
          color={colors.bleu} 
          to="/hopitaux" 
          loading={loading} 
        />
        <StatCard 
          icon="🏢" 
          label="Départements" 
          value={stats.departements} 
          color={colors.orange} 
          to="/departements" 
          loading={loading} 
        />
        <StatCard 
          icon="⚕️" 
          label="Services" 
          value={stats.services} 
          color="#6c3fc5" 
          to="/services" 
          loading={loading} 
        />
        <StatCard 
          icon="👤" 
          label="Personnel" 
          value={stats.personnels} 
          color={colors.success} 
          to="/personnels" 
          loading={loading} 
        />
        <StatCard 
          icon="🧑‍🤝‍🧑" 
          label="Patients" 
          value={patientStats.value} 
          subValue={patientStats.label}
          color="#e91e63" 
          to="/patients" 
          loading={loading} 
        />
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div style={{
          background: colors.white,
          borderRadius: radius.lg,
          padding: spacing.lg,
          boxShadow: shadows.sm,
        }}>
          <h3 style={{ margin: '0 0 16px', color: colors.bleu, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📊</span> Résumé organisation
          </h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {[
              { label: 'Établissements', value: stats.hospitals, icon: '🏥' },
              { label: 'Départements', value: stats.departements, icon: '🏢' },
              { label: 'Services médicaux', value: stats.services, icon: '⚕️' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: colors.gray50, borderRadius: radius.md }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <span style={{ fontSize: 13, color: colors.gray600 }}>{item.label}</span>
                </div>
                <span style={{ fontSize: 18, fontWeight: 800, color: colors.bleu }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          background: colors.white,
          borderRadius: radius.lg,
          padding: spacing.lg,
          boxShadow: shadows.sm,
        }}>
          <h3 style={{ margin: '0 0 16px', color: colors.bleu, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>👥</span> Personnel & Patients
          </h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {[
              { label: 'Personnel total', value: stats.personnels, icon: '👨‍⚕️' },
              { label: 'Patients total', value: stats.patients, icon: '🧑‍🤝‍🧑' },
              { label: 'Période active', value: patientStats.label, icon: '📅' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: colors.gray50, borderRadius: radius.md }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <span style={{ fontSize: 13, color: colors.gray600 }}>{item.label}</span>
                </div>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#e91e63' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}