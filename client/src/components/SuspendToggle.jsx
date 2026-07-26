function SuspendToggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        value ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
      }`}
    >
      {value ? 'Suspended' : 'Active'}
    </button>
  )
}

export default SuspendToggle
