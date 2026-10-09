import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const variants = {
  // Primary actions are brand orange so they stand out from the blue chrome; secondary is calm blue.
  default:
    'bg-gradient-to-b from-secondary-500 to-secondary-600 text-white shadow-glow-orange hover:from-orange-400 hover:to-secondary-600 hover:shadow-lift ring-1 ring-inset ring-white/20',
  secondary:
    'bg-gradient-to-b from-primary-500 to-primary-600 text-white shadow-glow-blue hover:from-primary-400 hover:to-primary-600 hover:shadow-lift ring-1 ring-inset ring-white/20',
  outline: 'border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
};

const sizes = {
  sm: 'min-h-11 px-4 py-2 text-xs',
  md: 'px-5 py-3 text-sm',
  lg: 'px-6 py-3.5 text-base',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', loading = false, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 active:scale-[0.98]',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/25',
          'disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:active:scale-100',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
