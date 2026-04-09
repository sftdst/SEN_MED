import { colors, radius } from '../../theme'

export default function Pagination({ meta, onPageChange, onPerPageChange }) {
  if (!meta) return null

  const { current_page, last_page, total, from, to, per_page } = meta

  // Construire les numéros de pages avec ellipsis
  const range = []
  for (let i = 1; i <= last_page; i++) {
    if (i === 1 || i === last_page || (i >= current_page - 2 && i <= current_page + 2)) {
      range.push(i)
    }
  }
  const pages = []
  let prev = 0
  for (const p of range) {
    if (p - prev > 1) pages.push(null)
    pages.push(p)
    prev = p
  }

  const btnStyle = (disabled, active = false) => ({
    minWidth: 32, height: 32, padding: '0 10px',
    border: `1px solid ${active ? colors.bleu : colors.gray200}`,
    borderRadius: radius.sm,
    background: active ? colors.bleu : colors.white,
    color: active ? colors.white : disabled ? colors.gray300 : colors.gray700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 13, fontWeight: active ? 700 : 400,
    transition: 'all 0.15s',
    outline: 'none',
  })

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 20px',
      borderTop: `1px solid ${colors.gray100}`,
      background: colors.gray50,
      flexWrap: 'wrap', gap: 10,
    }}>
      {/* Compteur */}
      <div style={{ fontSize: 12, color: colors.gray500 }}>
        {from ?? 0} – {to ?? 0} sur{' '}
        <strong style={{ color: colors.gray700 }}>{total}</strong>{' '}
        résultat{total !== 1 ? 's' : ''}
      </div>

      {/* Boutons de pages */}
      {last_page > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={() => onPageChange(current_page - 1)}
            disabled={current_page <= 1}
            style={btnStyle(current_page <= 1)}
          >
            ‹
          </button>

          {pages.map((p, i) =>
            p === null
              ? <span key={`e${i}`} style={{ padding: '0 4px', color: colors.gray400, fontSize: 13 }}>…</span>
              : <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  style={btnStyle(false, p === current_page)}
                >
                  {p}
                </button>
          )}

          <button
            onClick={() => onPageChange(current_page + 1)}
            disabled={current_page >= last_page}
            style={btnStyle(current_page >= last_page)}
          >
            ›
          </button>
        </div>
      )}

      {/* Sélecteur par page */}
      {onPerPageChange && (
        <select
          value={per_page}
          onChange={e => onPerPageChange(Number(e.target.value))}
          style={{
            fontSize: 12, padding: '4px 8px',
            border: `1px solid ${colors.gray200}`,
            borderRadius: radius.sm,
            color: colors.gray700,
            background: colors.white,
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {[10, 15, 25, 50].map(n => (
            <option key={n} value={n}>{n} / page</option>
          ))}
        </select>
      )}
    </div>
  )
}
