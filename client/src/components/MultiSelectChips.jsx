function MultiSelectChips({
  title,
  description,
  selected = [],
  onChange,
  options = [],
}) {
  const toggle = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option)
          return (
            <button
              type="button"
              key={option}
              onClick={() => toggle(option)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
                active
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default MultiSelectChips
