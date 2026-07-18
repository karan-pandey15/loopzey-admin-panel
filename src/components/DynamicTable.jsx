import DataTable from './DataTable';

function labelFromKey(key) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function renderValue(value) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-slate-400">—</span>;
  }

  if (typeof value === 'object') {
    return <span className="text-xs text-slate-500">{JSON.stringify(value)}</span>;
  }

  return String(value);
}

export default function DynamicTable({ extraColumns = [], rows }) {
  const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const columns = [
    ...keys.map((key) => ({
      key,
      label: labelFromKey(key),
      render: (row) => renderValue(row[key]),
    })),
    ...extraColumns,
  ];

  return (
    <DataTable
      columns={columns}
      getRowKey={(row, index) =>
        row.id || row.reportId || row.approvalId || row.userId || index
      }
      rows={rows}
    />
  );
}
