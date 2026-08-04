import { useState } from 'react';
import type { ResearchSource } from '@extension/shared';

interface SourceListProps {
  sources: ResearchSource[];
  onChange: (sources: ResearchSource[]) => void;
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
 * Add/remove source links for a record. The user's conclusion is kept visually
 * separate from its sources (PRD FR-07).
 */
export const SourceList = ({ sources, onChange }: SourceListProps) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const addSource = () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError('Enter a source URL.');
      return;
    }
    if (!isValidHttpUrl(trimmedUrl)) {
      setError('Source URL must start with http:// or https://');
      return;
    }

    const source: ResearchSource = {
      id: crypto.randomUUID(),
      url: trimmedUrl,
      title: title.trim().slice(0, 300),
      createdAt: new Date().toISOString(),
    };

    onChange([...sources, source]);
    setUrl('');
    setTitle('');
    setError(null);
  };

  const removeSource = (id: string) => {
    onChange(sources.filter(source => source.id !== id));
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-slate-600">Sources</span>

      {sources.length > 0 && (
        <ul className="flex flex-col gap-1">
          {sources.map(source => (
            <li key={source.id} className="flex items-start justify-between gap-2 rounded bg-slate-50 px-2 py-1">
              <div className="min-w-0">
                {source.title ? (
                  <p className="truncate text-xs font-medium text-slate-700">{source.title}</p>
                ) : (
                  <p className="text-[11px] italic text-slate-400">Untitled source</p>
                )}
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block max-w-full truncate text-[11px] text-blue-600 hover:underline">
                  {source.url}
                </a>
              </div>
              <button
                type="button"
                onClick={() => removeSource(source.id)}
                className="shrink-0 text-[11px] font-medium text-red-600 hover:text-red-700 focus:outline-none focus-visible:underline">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-1 rounded border border-slate-200 p-2">
        <input
          type="url"
          value={url}
          onChange={event => setUrl(event.target.value)}
          placeholder="https://example.com/source"
          className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input
          type="text"
          value={title}
          onChange={event => setTitle(event.target.value)}
          placeholder="Source title (optional)"
          maxLength={300}
          className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {error && <p className="text-[11px] text-red-600">{error}</p>}
        <button
          type="button"
          onClick={addSource}
          className="self-start rounded bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
          Add source
        </button>
      </div>
    </div>
  );
};
