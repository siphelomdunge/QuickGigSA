import * as React from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
}

export function Textarea({ label, hint, className, ...props }: TextareaProps) {
  return (
    <label className="block space-y-2 text-sm font-medium text-slate-700">
      <span className="flex items-baseline justify-between gap-3">
        <span>{label}</span>
        {hint ? <span className="text-xs font-normal text-slate-400">{hint}</span> : null}
      </span>
      <textarea className={cn('field resize-y leading-6', className)} {...props} />
    </label>
  );
}
