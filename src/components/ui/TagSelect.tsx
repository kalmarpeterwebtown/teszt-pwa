import { useState, useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface TagItem {
  id: string;
  name: string;
  category?: string;
}

interface TagSelectProps {
  items: TagItem[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  label?: string;
  placeholder?: string;
}

export function TagSelect({ items, selectedIds, onChange, label, placeholder = 'Keresés...' }: TagSelectProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = items.filter(
    (item) =>
      !selectedIds.includes(item.id) &&
      (item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category?.toLowerCase().includes(search.toLowerCase()))
  );

  const selected = items.filter((item) => selectedIds.includes(item.id));

  const handleSelect = (id: string) => {
    onChange([...selectedIds, id]);
    setSearch('');
  };

  const handleRemove = (id: string) => {
    onChange(selectedIds.filter((i) => i !== id));
  };

  return (
    <div className="w-full relative" ref={wrapperRef}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div className="border border-gray-300 rounded-lg p-2 min-h-[42px]">
        <div className="flex flex-wrap gap-1 mb-2">
          {selected.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
            >
              {item.name}
              <button type="button" onClick={() => handleRemove(item.id)} className="hover:bg-blue-200 rounded">
                <XMarkIcon className="h-4 w-4" />
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-2 py-1 text-sm border-0 focus:outline-none focus:ring-0"
        />
      </div>
      {isOpen && filtered.length > 0 && (
        <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto bg-white border border-gray-300 rounded-lg shadow-lg">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex justify-between items-center"
            >
              <span>{item.name}</span>
              {item.category && <span className="text-gray-500 text-xs">{item.category}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
