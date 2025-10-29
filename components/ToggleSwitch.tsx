
import React from 'react';

interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ id, checked, onChange }) => {
  return (
    <label htmlFor={id} className="relative w-[120px] h-[50px] cursor-pointer">
      <input type="checkbox" id={id} onChange={onChange} checked={checked} className="opacity-0 w-0 h-0 peer" />
      <span className="
        absolute top-0 left-0 right-0 bottom-0 bg-purple-700 rounded-full transition-all duration-400
        before:absolute before:content-['CNPJ'] before:h-[42px] before:w-[60px] before:left-[4px] before:bottom-[4px]
        before:bg-white before:rounded-full before:transition-all before:duration-400
        before:flex before:items-center before:justify-center before:font-bold before:text-sm before:text-purple-700
        peer-checked:before:translate-x-[56px] peer-checked:before:content-['CPF']"
      ></span>
    </label>
  );
};

export default ToggleSwitch;
