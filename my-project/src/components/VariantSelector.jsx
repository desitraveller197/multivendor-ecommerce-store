function VariantSelector({ options = [], selected, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          type="button"
          key={option}
          onClick={() => onChange(option)}
          className={`rounded-full border px-3 py-1 text-sm ${
            selected === option
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-slate-300 text-slate-700'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

export default VariantSelector
