export default function FormButton({ children, onClick, type='button', loading=false, variant='primary', disabled=false }) {
  const baseClasses = "flex items-center justify-center rounded px-4 py-2 font-semibold transition-colors outline-none disabled:opacity-70 disabled:cursor-not-allowed"
  
  let variantClasses = ""
  switch (variant) {
    case 'primary':
      variantClasses = "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      break
    case 'danger':
      variantClasses = "bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      break
    case 'outline':
      variantClasses = "border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
      break
    default:
      variantClasses = "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses}`}
    >
      {loading && (
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
      )}
      {children}
    </button>
  )
}
