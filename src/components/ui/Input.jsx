export function Input({ value, onChange, placeholder = '', type = 'text', style = {} }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="input"
      style={style}
    />
  )
}
