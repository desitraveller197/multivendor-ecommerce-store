function PageFrame({ title, description, children, actions }) {
  return (
    <section className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-800 p-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-200">{description}</p>
          </div>
          {actions}
        </div>
      </div>
      {children}
    </section>
  )
}

export default PageFrame
