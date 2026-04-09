import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { hospitalApi, departementApi, serviceApi, personnelApi } from '../api'
import { colors, radius, shadows } from '../theme'
import Spinner from '../components/ui/Spinner'

function StatCard({ icon, label, value, color, to, loading }) {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => navigate(to)}
      style={{
        background: colors.white,
        borderRadius: radius.lg,
        padding: '24px 28px',
        boxShadow: shadows.sm,
        display: 'flex', alignItems: 'center', gap: 20,
        cursor: 'pointer',
        borderLeft: `5px solid ${color}`,
        transition: 'transform 0.18s, box-shadow 0.18s',
        flex: 1, minWidth: 200,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)'
        e.currentTarget.style.boxShadow = shadows.md
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = shadows.sm
      }}
    >
      <div style={{
        width: 56, height: 56, borderRadius: radius.md,
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 13, color: colors.gray500, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: colors.gray900, lineHeight: 1.2 }}>
          {loading ? <Spinner size={22} color={color} /> : value}
        </div>
      </div>
    </div>
  )
}

function QuickAction({ icon, label, desc, color, to }) {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => navigate(to)}
      style={{
        background: colors.white,
        borderRadius: radius.md,
        padding: '18px 20px',
        boxShadow: shadows.sm,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 14,
        transition: 'all 0.18s',
        border: `1.5px solid ${colors.gray200}`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = color
        e.currentTarget.style.boxShadow = shadows.md
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = colors.gray200
        e.currentTarget.style.boxShadow = shadows.sm
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: radius.sm,
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: colors.bleu }}>{label}</div>
        <div style={{ fontSize: 12, color: colors.gray500, marginTop: 2 }}>{desc}</div>
      </div>
      <div style={{ marginLeft: 'auto', color: colors.gray400, fontSize: 18 }}>›</div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({ hospitals: 0, departements: 0, services: 0, personnels: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      hospitalApi.liste().catch(() => ({ data: { data: [] } })),
      departementApi.liste().catch(() => ({ data: { data: [] } })),
      serviceApi.liste().catch(() => ({ data: { data: [] } })),
      personnelApi.liste().catch(() => ({ data: { data: { total: 0 } } })),
    ]).then(([h, d, s, p]) => {
      setStats({
        hospitals:   h.data?.data?.length ?? 0,
        departements: d.data?.data?.length ?? 0,
        services:    s.data?.data?.length ?? 0,
        personnels:  p.data?.data?.total ?? p.data?.data?.length ?? 0,
      })
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Welcome banner */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.bleu} 0%, ${colors.bleuLight} 100%)`,
        borderRadius: radius.lg,
        padding: '28px 32px',
        marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: shadows.md,
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', right: -30, top: -30,
          width: 180, height: 180, borderRadius: '50%',
          background: 'rgba(255,118,49,0.15)',
        }} />
        <div style={{
          position: 'absolute', right: 60, bottom: -40,
          width: 120, height: 120, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }} />
        <div>
          <h1 style={{ margin: 0, color: colors.white, fontSize: 26, fontWeight: 800 }}>
            Bienvenue sur <span style={{ color: colors.orange }}>SenMed</span>
          </h1>
          <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
            Plateforme de gestion des soins médicaux — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div style={{ fontSize: 64, opacity: 0.3 }}>🏥</div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 28 }}>
        <StatCard icon="🏥" label="Hôpitaux"     value={stats.hospitals}    color={colors.bleu}    to="/hopitaux"      loading={loading} />
        <StatCard icon="🏢" label="Départements" value={stats.departements} color={colors.orange}  to="/departements"  loading={loading} />
        <StatCard icon="⚕️" label="Services"     value={stats.services}     color="#6c3fc5"        to="/services"      loading={loading} />
        <StatCard icon="👤" label="Personnel"    value={stats.personnels}   color={colors.success} to="/personnels"    loading={loading} />
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        <div>
          <h3 style={{ margin: '0 0 14px', color: colors.bleu, fontSize: 16, fontWeight: 700 }}>
            Accès rapides
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <QuickAction icon="🏥" label="Gérer les hôpitaux"     desc="Organisations et établissements"   color={colors.bleu}    to="/hopitaux" />
            <QuickAction icon="🏢" label="Gérer les départements" desc="Structure organisationnelle"        color={colors.orange}  to="/departements" />
            <QuickAction icon="📋" label="Types de service"       desc="Catégories de soins"               color="#6c3fc5"        to="/type-services" />
            <QuickAction icon="⚕️" label="Gérer les services"     desc="Services médicaux disponibles"     color="#1565c0"        to="/services" />
            <QuickAction icon="👤" label="Gérer le personnel"     desc="Médecins, infirmiers, techniciens" color={colors.success} to="/personnels" />
          </div>
        </div>

        {/* Info panel */}
        <div>
          <h3 style={{ margin: '0 0 14px', color: colors.bleu, fontSize: 16, fontWeight: 700 }}>
            Informations système
          </h3>
          <div style={{
            background: colors.white,
            borderRadius: radius.md,
            boxShadow: shadows.sm,
            overflow: 'hidden',
          }}>
            {[
              { label: 'Version',       value: '1.0.0',          icon: '⚙️' },
              { label: 'Backend',       value: 'Laravel 11',      icon: '🔧' },
              { label: 'Base de données', value: 'PostgreSQL',   icon: '🗄️' },
              { label: 'API URL',       value: 'localhost:8000',  icon: '🔗' },
              { label: 'Statut',        value: '✅ Opérationnel', icon: '📡' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 20px',
                borderBottom: i < 4 ? `1px solid ${colors.gray100}` : 'none',
              }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span style={{ color: colors.gray600, fontSize: 13, flex: 1 }}>{item.label}</span>
                <span style={{ color: colors.gray900, fontSize: 13, fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Charte graphique */}
          <div style={{
            background: colors.white,
            borderRadius: radius.md,
            boxShadow: shadows.sm,
            padding: '18px 20px',
            marginTop: 14,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.bleu, marginBottom: 12 }}>Charte graphique</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{
                flex: 1, height: 40, borderRadius: radius.sm,
                background: colors.orange,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: colors.white, fontSize: 12, fontWeight: 700,
              }}>#ff7631</div>
              <div style={{
                flex: 1, height: 40, borderRadius: radius.sm,
                background: colors.bleu,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: colors.white, fontSize: 12, fontWeight: 700,
              }}>#002f59</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
