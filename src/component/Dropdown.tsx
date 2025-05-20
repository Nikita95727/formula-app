import React from 'react';

interface DropdownProps {
  options: string[];
  selectedOption: string;
  onSelect: (option: string) => void;
}

const Dropdown: React.FC<DropdownProps> = ({ options, selectedOption, onSelect }) => {
  return (
    <div className="relative">
      <select
        value={selectedOption}
        onChange={(e) => onSelect(e.target.value)}
        className="block w-full ml-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Dropdown;