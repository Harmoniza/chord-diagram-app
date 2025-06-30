import { useState } from "react";
import type { ReactNode } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

type Props = {
  title: string;
  children: ReactNode;
};

export default function CollapsibleSection({ title, children }: Props) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mb-6 border border-gray-300 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-left"
      >
        <span className="font-semibold text-lg">{title}</span>
        {isOpen ? <FaChevronUp /> : <FaChevronDown />}
      </button>

      {isOpen && <div className="p-4 bg-white">{children}</div>}
    </div>
  );
}
