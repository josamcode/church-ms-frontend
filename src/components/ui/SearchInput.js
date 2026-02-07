import { useRef, useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchInput({
  value,
  onChange,
  placeholder = 'بحث...',
  debounceMs = 400,
  className = '',
}) {
  const [localValue, setLocalValue] = useState(value || '');
  const timer = useRef(null);

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleChange = (e) => {
    const val = e.target.value;
    setLocalValue(val);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      onChange?.(val);
    }, debounceMs);
  };

  const handleClear = () => {
    setLocalValue('');
    if (timer.current) clearTimeout(timer.current);
    onChange?.('');
  };

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="input-base pr-10 pl-10"
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted hover:text-base transition-colors"
          aria-label="مسح"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
