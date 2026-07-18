function renderCell(value) {
  if (typeof value === 'boolean') {
    return (
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
          value ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
        }`}
      >
        {value ? 'Yes' : 'No'}
      </span>
    );
  }

  if (value === null || value === undefined || value === '') {
    return <span className="text-slate-400">—</span>;
  }

  return String(value);
}

export default function DataTable({ columns, getRowKey, rows }) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {rows.map((row, index) => (
          <article
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            key={getRowKey(row, index)}
          >
            {columns.map((column) => (
              <div
                className="grid grid-cols-[minmax(90px,0.38fr)_minmax(0,0.62fr)] gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0"
                key={column.key}
              >
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  {column.label}
                </p>
                <div className="min-w-0 break-words text-right text-sm text-slate-700">
                  {column.render ? column.render(row) : renderCell(row[column.key])}
                </div>
              </div>
            ))}
          </article>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40 md:block">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              {columns.map((column) => (
                <th
                  className="whitespace-nowrap px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500"
                  key={column.key}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, index) => (
              <tr className="transition hover:bg-slate-50/70" key={getRowKey(row, index)}>
                {columns.map((column) => (
                  <td className="max-w-xs px-5 py-4 text-slate-700" key={column.key}>
                    {column.render ? column.render(row) : renderCell(row[column.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </>
  );
}
