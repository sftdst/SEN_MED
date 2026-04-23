import { colors, radius } from '../../theme'

export default function SearchBar({ value, onChange, placeholder = 'Rechercher...' }) {
  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '9px 12px 9px 36px',
          border: `1.5px solid ${colors.gray300}`,
          borderRadius: radius.md,
          fontSize: 13,
          outline: 'none',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor = colors.bleu}
        onBlur={e => e.target.style.borderColor = colors.gray300}
      />
      <span style={{
        position: 'absolute',
        left: 10,
        top: '50%',
        transform: 'translateY(-50%)',
        color: colors.gray400,
        fontSize: 14,
        pointerEvents: 'none',
      }}>🔍</span>
    </div>
  )
}
