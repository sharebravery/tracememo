interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({ message, actionLabel, onAction }: EmptyStateProps) => (
  <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/20 text-violet-300">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
      </svg>
    </div>
    <p className="text-sm text-slate-400">{message}</p>
    {actionLabel && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-lg shadow-violet-500/25 transition hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60">
        {actionLabel}
      </button>
    )}
  </div>
);
