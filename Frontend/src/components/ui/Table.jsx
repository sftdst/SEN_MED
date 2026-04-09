import { colors } from '../../theme'
import Spinner from './Spinner'

export default function Table({ columns, data, loading = false, emptyText = 'Aucune donnée' }) {
  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ background: colors.bleu }}>
            {columns.map((col, i) => (
              <th key={i} style={{
                padding: '12px 16px',
                textAlign: col.align || 'left',
                color: colors.white,
                fontWeight: 600,
                fontSize: 13,
                whiteSpace: 'nowrap',
                width: col.width,
              }}>
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: 48 }}>
                <Spinner size={32} />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{
                textAlign: 'center', padding: 48,
                color: colors.gray500, fontSize: 14,
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, ri) => (
              <tr
                key={ri}
                style={{ background: ri % 2 === 0 ? colors.white : colors.gray50 }}
                onMouseEnter={e => e.currentTarget.style.background = colors.orangeLight}
                onMouseLeave={e => e.currentTarget.style.background = ri % 2 === 0 ? colors.white : colors.gray50}
              >
                {columns.map((col, ci) => (
                  <td key={ci} style={{
                    padding: '11px 16px',
                    borderBottom: `1px solid ${colors.gray200}`,
                    color: colors.gray800,
                    textAlign: col.align || 'left',
                    verticalAlign: 'middle',
                  }}>
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
