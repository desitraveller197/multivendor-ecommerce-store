function StarRating({ value = 0, outOf = 5 }) {
  return (
    <div className="flex items-center gap-1 text-amber-500">
      {Array.from({ length: outOf }).map((_, i) => (
        <span key={i}>{i < value ? '★' : '☆'}</span>
      ))}
    </div>
  )
}

export default StarRating
