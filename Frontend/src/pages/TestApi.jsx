import { useEffect, useState } from 'react'
import { hospitalApi, departementApi, personnelApi } from '../api'

const ORANGE = '#ff7631'
const BLEU   = '#002f59'

export default function TestApi() {
  const [statuts, setStatuts]   = useState({})
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const tester = async () => {
      const resultats = {}

      const endpoints = [
        { clé: 'Hôpitaux',    fn: hospitalApi.liste },
        { clé: 'Départements', fn: departementApi.liste },
        { clé: 'Personnel',   fn: personnelApi.liste },
        { clé: 'Métadonnées', fn: personnelApi.metadata },
      ]

      for (const { clé, fn } of endpoints) {
        try {
          const res = await fn()
          resultats[clé] = { ok: true, status: res.status, data: res.data }
        } catch (err) {
          resultats[clé] = {
            ok: false,
            status: err.response?.status || 0,
            message: err.message,
          }
        }
      }

      setStatuts(resultats)
      setLoading(false)
    }

    tester()
  }, [])

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 32, background: '#f8f9fa', minHeight: '100vh' }}>
      {/* En-tête */}
      <div style={{ background: BLEU, color: '#fff', padding: '20px 32px', borderRadius: 12, marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
          <span style={{ color: ORANGE }}>Sen</span>Med
        </h1>
        <p style={{ margin: '4px 0 0', opacity: 0.8 }}>Test de connexion Backend ↔ Frontend</p>
      </div>

      {loading ? (
        <p style={{ color: BLEU, fontWeight: 600 }}>Test en cours...</p>
      ) : (
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {Object.entries(statuts).map(([clé, res]) => (
            <div
              key={clé}
              style={{
                background: '#fff',
                borderRadius: 10,
                padding: 20,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                borderLeft: `5px solid ${res.ok ? ORANGE : '#e74c3c'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: BLEU }}>{clé}</h3>
                <span
                  style={{
                    background: res.ok ? '#e8f5e9' : '#fdecea',
                    color: res.ok ? '#2e7d32' : '#c62828',
                    padding: '4px 10px',
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {res.ok ? `✓ HTTP ${res.status}` : `✗ Erreur`}
                </span>
              </div>
              {res.ok ? (
                <p style={{ margin: '10px 0 0', fontSize: 13, color: '#555' }}>
                  {res.data?.data?.total !== undefined
                    ? `${res.data.data.total} enregistrement(s)`
                    : res.data?.data
                    ? `Données reçues`
                    : 'Réponse OK'}
                </p>
              ) : (
                <p style={{ margin: '10px 0 0', fontSize: 13, color: '#c62828' }}>{res.message}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 40, padding: 20, background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <h3 style={{ color: BLEU, marginTop: 0 }}>Endpoints disponibles</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: BLEU, color: '#fff' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left' }}>Méthode</th>
              <th style={{ padding: '8px 12px', textAlign: 'left' }}>URL</th>
              <th style={{ padding: '8px 12px', textAlign: 'left' }}>Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['GET', '/api/v1/hospitals', 'Liste des hôpitaux'],
              ['GET', '/api/v1/departements', 'Liste des départements'],
              ['GET', '/api/v1/type-services', 'Types de service'],
              ['GET', '/api/v1/services', 'Services'],
              ['GET', '/api/v1/personnels', 'Liste du personnel'],
              ['POST', '/api/v1/personnels', 'Créer personnel (complet)'],
              ['POST', '/api/v1/personnels/creation-rapide', 'Créer personnel (rapide)'],
              ['GET', '/api/v1/personnels/metadata', 'Métadonnées formulaires'],
            ].map(([method, url, desc], i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#f8f9fa' : '#fff' }}>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{
                    color: method === 'GET' ? '#1976d2' : method === 'POST' ? '#388e3c' : '#f57c00',
                    fontWeight: 700, fontFamily: 'monospace'
                  }}>{method}</span>
                </td>
                <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#555' }}>{url}</td>
                <td style={{ padding: '8px 12px', color: '#333' }}>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
