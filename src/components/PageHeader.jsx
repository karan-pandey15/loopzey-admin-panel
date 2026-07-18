export default function PageHeader({ action, description, eyebrow, title }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-yellow-600">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          {title}
        </h1>
        {description && <p className="mt-2 text-sm text-slate-500">{description}</p>}
      </div>
      {action && (
        <div className="w-full shrink-0 [&>button]:w-full sm:w-auto sm:[&>button]:w-auto">
          {action}
        </div>
      )}
    </header>
  );
}
