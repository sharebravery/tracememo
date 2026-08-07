import { t } from '@extension/i18n';
import { SOURCE_TITLE_MAX, SOURCE_URL_MAX } from '@extension/shared';
import { useState } from 'react';
import type { SourceInput } from '@extension/shared';

interface SourceListProps {
  sources: SourceInput[];
  onChange: (sources: SourceInput[]) => void;
}

const isValidHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Add/remove source links for a record. The UI authors only `url` and `title`;
 * the background generates `id` and `createdAt` on save. The user's conclusion
 * is kept visually separate from its sources (PRD FR-07).
 */
export const SourceList = ({ sources, onChange }: SourceListProps) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const addSource = () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError(t('editor_sources'));
      return;
    }
    if (!isValidHttpUrl(trimmedUrl)) {
      setError(t('editor_sources'));
      return;
    }

    onChange([
      ...sources,
      { url: trimmedUrl.slice(0, SOURCE_URL_MAX), title: title.trim().slice(0, SOURCE_TITLE_MAX) },
    ]);
    setUrl('');
    setTitle('');
    setError(null);
  };

  const removeSource = (index: number) => {
    onChange(sources.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Sources</span>

      {sources.length > 0 && (
        <ul className="flex flex-col gap-1">
          {sources.map((source, index) => (
            <li
              key={`${source.url}-${index}`}
              className="flex items-start justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1">
              <div className="min-w-0">
                {source.title ? (
                  <p className="truncate text-xs font-medium text-slate-200">{source.title}</p>
                ) : (
                  <p className="text-[11px] italic text-slate-500">Untitled source</p>
                )}
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block max-w-full truncate font-mono text-[11px] text-cyan-300 hover:underline">
                  {source.url}
                </a>
              </div>
              <button
                type="button"
                onClick={() => removeSource(index)}
                className="shrink-0 text-[11px] font-medium text-rose-400 transition hover:text-rose-300 focus:outline-none focus-visible:underline">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-1 rounded-lg border border-white/10 bg-white/[0.02] p-2">
        <input
          type="url"
          value={url}
          onChange={event => setUrl(event.target.value)}
          placeholder="https://example.com/source"
          maxLength={SOURCE_URL_MAX}
          className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-xs text-slate-100 placeholder:text-slate-500 focus:border-violet-500/60 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
        />
        <input
          type="text"
          value={title}
          onChange={event => setTitle(event.target.value)}
          placeholder="Source title (optional)"
          maxLength={SOURCE_TITLE_MAX}
          className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-100 placeholder:text-slate-500 focus:border-violet-500/60 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
        />
        {error && <p className="text-[11px] text-rose-400">{error}</p>}
        <button
          type="button"
          onClick={addSource}
          className="self-start rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs font-medium text-slate-200 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50">
          + Add source
        </button>
      </div>
    </div>
  );
};
