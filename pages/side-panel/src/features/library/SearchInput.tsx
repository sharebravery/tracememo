interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchInput = ({ value, onChange }: SearchInputProps) => (
  <div className="flex flex-col gap-1">
    <label htmlFor="tracememo-search" className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
      Search
    </label>
    <div className="relative">
      <svg
        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
      </svg>
      <input
        id="tracememo-search"
        type="search"
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder="Label, address, note, tag"
        className="w-full rounded-lg border border-white/10 bg-white/5 py-1.5 pl-8 pr-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-500/60 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
      />
    </div>
  </div>
);
