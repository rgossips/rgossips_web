"use client";
import React, { useState, useRef, useEffect } from "react";

export default function MultiSelectInput({
  options,
  selected,
  onChange,
  placeholder,
}) {
  const [inputVal, setInputVal] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef(null);

  // Filter options to show in dropdown
  const filteredOptions = options.filter(
    (opt) =>
      !selected?.includes(opt) &&
      opt.toLowerCase().includes(inputVal.toLowerCase())
  );

  const addOption = (opt) => {
    if (!selected.includes(opt)) onChange([...selected, opt]);
    setInputVal("");
    setDropdownOpen(false);
  };

  const removeOption = (opt) => onChange(selected.filter((x) => x !== opt));

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className="flex flex-wrap gap-2 border p-2 rounded cursor-text"
        onClick={() => setDropdownOpen(true)}
      >
        {selected?.map((s) => (
          <div
            key={s}
            className="flex items-center bg-blue-200 text-blue-800 px-2 py-1 rounded"
          >
            <span>{s}</span>
            <button
              type="button"
              className="ml-1 font-bold cursor-pointer"
              onClick={() => removeOption(s)}
            >
              ×
            </button>
          </div>
        ))}

        <input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder={placeholder}
          className="flex-1 outline-none"
        />
      </div>

      {/* Dropdown */}
      {dropdownOpen && filteredOptions.length > 0 && (
        <div className="absolute z-10 bg-white border w-full mt-1 rounded shadow max-h-40 overflow-y-auto">
          {filteredOptions.map((opt) => (
            <div
              key={opt}
              className="px-2 py-1 hover:bg-blue-100 cursor-pointer"
              onClick={() => addOption(opt)}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
