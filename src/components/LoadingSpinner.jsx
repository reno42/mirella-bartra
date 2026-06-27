export default function LoadingSpinner({ size = 24, color = 'var(--text-dark)' }) {
  return (
    <div
      className="spinner"
      style={{ width: size, height: size, borderTopColor: color }}
      aria-label="Cargando..."
      role="status"
    />
  )
}
