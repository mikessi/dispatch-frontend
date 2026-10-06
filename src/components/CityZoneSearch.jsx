import { useState } from "react";
import { cityZones } from "../utils/cityZones";
import { inputClass, labelClass } from "./ui";

const MAX_SUGGESTIONS = 8;

const findMatches = (query) => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  // Cities starting with the query first, then ones containing it
  const startsWith = cityZones.filter(({ city }) => city.toLowerCase().startsWith(q));
  const contains = cityZones.filter(({ city }) => {
    const name = city.toLowerCase();
    return !name.startsWith(q) && name.includes(q);
  });
  return [...startsWith, ...contains].slice(0, MAX_SUGGESTIONS);
};

export default function CityZoneSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

  const matches = findMatches(query);

  const choose = (match) => {
    setQuery(match.city);
    setSelected(match);
    setIsOpen(false);
    onSelect?.(match.zone);
  };

  const handleInput = (e) => {
    setQuery(e.target.value);
    setSelected(null);
    setIsOpen(true);
    setHighlighted(0);
  };

  const handleKeyDown = (e) => {
    if (!isOpen || matches.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted(i => (i + 1) % matches.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted(i => (i - 1 + matches.length) % matches.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(matches[highlighted]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div>
      <label className={labelClass}>
        City Zone Lookup
      </label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setIsOpen(false)}
            className={inputClass}
            placeholder="Search city name"
            autoComplete="off"
          />
          {isOpen && query.trim() && (
            <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
              {matches.length === 0 ? (
                <li className="px-3 py-2 text-sm text-gray-500">No matching city</li>
              ) : (
                matches.map((match, i) => (
                  <li
                    key={match.city}
                    // onMouseDown so the pick lands before the input's blur closes the list
                    onMouseDown={(e) => {
                      e.preventDefault();
                      choose(match);
                    }}
                    onMouseEnter={() => setHighlighted(i)}
                    className={`flex justify-between px-3 py-2 text-sm cursor-pointer ${
                      i === highlighted ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                    }`}
                  >
                    <span>{match.city}</span>
                    <span className="font-semibold">Zone {match.zone}</span>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
        <div className="w-24 text-center rounded-lg border border-gray-300 bg-white py-2 text-sm">
          {selected ? (
            <span className="font-semibold text-purple-700">Zone {selected.zone}</span>
          ) : (
            <span className="text-gray-400">Zone —</span>
          )}
        </div>
      </div>
    </div>
  );
}
