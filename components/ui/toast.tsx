import { CheckCircle2 } from 'lucide-react';

export function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-5 left-4 right-4 z-[60] mx-auto flex max-w-md items-center gap-3 rounded-[1.25rem] border border-green-200 bg-white p-4 text-sm font-medium text-slate-900 shadow-soft sm:left-auto sm:right-5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-green-700">
        <CheckCircle2 className="h-5 w-5" />
      </span>
      {message}
    </div>
  );
}
