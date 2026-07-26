function StarRating({ value = 0, outOf = 5, size = 'md', showValue = false, className = '' }) {
  const clamped = Math.min(outOf, Math.max(0, Number(value) || 0))
  const fullStars = Math.floor(clamped)
  const hasHalf = clamped - fullStars >= 0.5

  const sizeClass = {
    sm: 'text-sm gap-0.5',
    md: 'text-base gap-0.5',
    lg: 'text-xl gap-1',
    xl: 'text-2xl gap-1',
  }[size] || 'text-base gap-0.5'

  const valueClass = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  }[size] || 'text-sm'

  return (
    <div className={`inline-flex items-center ${sizeClass} ${className}`} aria-label={`${clamped} out of ${outOf} stars`}>
      <div className="flex items-center text-amber-500">
        {Array.from({ length: outOf }).map((_, i) => {
          if (i < fullStars) {
            return (
              <span key={i} className="leading-none" aria-hidden="true">
                ★
              </span>
            )
          }
          if (i === fullStars && hasHalf) {
            return (
              <span key={i} className="relative inline-block leading-none" aria-hidden="true">
                <span className="text-slate-300">★</span>
                <span className="absolute left-0 top-0 w-1/2 overflow-hidden text-amber-500">★</span>
              </span>
            )
          }
          return (
            <span key={i} className="leading-none text-slate-300" aria-hidden="true">
              ★
            </span>
          )
        })}
      </div>
      {showValue ? (
        <span className={`font-semibold text-slate-700 ${valueClass}`}>{clamped.toFixed(1)}</span>
      ) : null}
    </div>
  )
}

export default StarRating
