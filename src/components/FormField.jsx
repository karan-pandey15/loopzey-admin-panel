export default function FormField({
  autoComplete,
  id,
  label,
  onChange,
  placeholder,
  required = false,
  type = 'text',
  value,
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </span>
      <input
        autoComplete={autoComplete}
        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-600"
        id={id}
        name={id}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />
    </label>
  );
}
