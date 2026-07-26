/**
 * Multi-select size picker for the seller product forms. `selected` is an array
 * of size labels; `onChange` receives the next array when a chip is toggled.
 */
const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL']

function SizeSelector({ selected = [], onChange, options = DEFAULT_SIZES }) {
  const toggle = (size) => {
    if (selected.includes(size)) {
      onChange(selected.filter((s) => s !== size))
    } else {
      onChange([...selected, size])
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h4 className="text-sm font-semibold text-slate-900">Available Sizes</h4>
      <p className="mt-1 text-xs text-slate-500">
        Pick the sizes customers can choose for this product.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((size) => {
          const active = selected.includes(size)
          return (
            <button
              type="button"
              key={size}
              onClick={() => toggle(size)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
                active
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {size}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default SizeSelector
