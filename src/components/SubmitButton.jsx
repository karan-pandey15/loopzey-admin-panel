import { LoaderCircle } from 'lucide-react';

export default function SubmitButton({ children, isLoading }) {
  return (
    <button
      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 text-sm font-bold text-slate-950 transition hover:bg-yellow-300 focus:outline-none focus:ring-4 focus:ring-yellow-400/20 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={isLoading}
      type="submit"
    >
      {isLoading && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
      {isLoading ? 'Please wait…' : children}
    </button>
  );
}
