interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({ message, actionLabel, onAction }: EmptyStateProps) => (
  <div className="flex flex-col items-center gap-3 rounded border border-dashed border-slate-300 p-6 text-center">
    <p className="text-sm text-slate-600">{message}</p>
    {actionLabel && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
        {actionLabel}
      </button>
    )}
  </div>
);
