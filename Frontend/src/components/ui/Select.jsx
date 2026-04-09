import { colors, radius } from '../../theme'

export default function Select({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Sélectionner...',
  required = false,
  error = '',
  disabled = false,
  style = {},
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, ...style }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 600, color: colors.gray700 }}>
          {label}
          {required && <span style={{ color: colors.orange, marginLeft: 3 }}>*</span>}
        </label>
      )}
      <select
        name={name}
        value={value ?? ''}
        onChange={onChange}
        required={required}
        disabled={disabled}
        style={{
          border: `1.5px solid ${error ? colors.danger : colors.gray300}`,
          borderRadius: radius.sm,
          padding: '8px 12px',
          fontSize: 14,
          color: value ? colors.gray900 : colors.gray500,
          background: disabled ? colors.gray100 : colors.white,
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
          cursor: disabled ? 'not-allowed' : 'pointer',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236c757d' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          paddingRight: 36,
        }}
        onFocus={e => { e.target.style.borderColor = colors.orange }}
        onBlur={e => { e.target.style.borderColor = error ? colors.danger : colors.gray300 }}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <span style={{ fontSize: 12, color: colors.danger }}>{error}</span>}
    </div>
  )
}
