import { CheckCircle2 } from 'lucide-react';

export function Toast({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="fixed bottom-5 left-4 right-4 z-[60] mx-auto flex max-w-md animate-scale-in items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/95 p-4 text-sm font-medium text-slate-900 shadow-lift backdrop-blur sm:left-auto sm:right-5"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-emerald-600 text-white shadow-md">
        <CheckCircle2 className="h-5 w-5" />
      </span>
      {message}
    </div>
  );
}
