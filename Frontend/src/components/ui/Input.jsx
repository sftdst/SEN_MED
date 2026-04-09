import { colors, radius } from '../../theme'

export default function Input({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false,
  error = '',
  disabled = false,
  hint = '',
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
      <input
        type={type}
        name={name}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        style={{
          border: `1.5px solid ${error ? colors.danger : colors.gray300}`,
          borderRadius: radius.sm,
          padding: '8px 12px',
          fontSize: 14,
          color: colors.gray900,
          background: disabled ? colors.gray100 : colors.white,
          outline: 'none',
          transition: 'border-color 0.15s',
          width: '100%',
          boxSizing: 'border-box',
        }}
        onFocus={e => { e.target.style.borderColor = error ? colors.danger : colors.orange }}
        onBlur={e => { e.target.style.borderColor = error ? colors.danger : colors.gray300 }}
      />
      {hint && !error && <span style={{ fontSize: 12, color: colors.gray500 }}>{hint}</span>}
      {error && <span style={{ fontSize: 12, color: colors.danger }}>{error}</span>}
    </div>
  )
}
