interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchInput = ({ value, onChange }: SearchInputProps) => (
  <div className="flex flex-col gap-1">
    <label htmlFor="tracememo-search" className="text-xs font-medium text-slate-600">
      Search
    </label>
    <input
      id="tracememo-search"
      type="search"
      value={value}
      onChange={event => onChange(event.target.value)}
      placeholder="Label, address, or note"
      className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    />
  </div>
);
