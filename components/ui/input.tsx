import * as React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

export function Input({ label, hint, className, ...props }: InputProps) {
  return (
    <label className="block space-y-2 text-sm font-medium text-slate-700">
      <span className="flex items-baseline justify-between gap-3">
        <span>{label}</span>
        {hint ? <span className="text-xs font-normal text-slate-400">{hint}</span> : null}
      </span>
      <input className={cn('field', className)} {...props} />
    </label>
  );
}
