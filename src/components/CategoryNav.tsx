import React from 'react';
import type { Category } from '../types/news.js';

interface Props {
  activeCategory: Category;
  onSelectCategory: (cat: Category) => void;
  categories: Category[];
}

export const CategoryNav: React.FC<Props> = ({
  activeCategory,
  onSelectCategory,
  categories,
}) => {
  return (
    <div className="border-b-2 border-[#d6c5af] bg-[#f6efe1]/85 backdrop-blur-md py-2 font-serif">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`px-3 py-1 rounded-md text-xs tracking-wide transition cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#881326] text-white shadow-xs font-bold border border-[#6b0f1a]'
                    : 'text-[#5d463b] hover:text-[#20130d] hover:bg-[#eadecc] border border-transparent'
                }`}
              >
                {cat === 'India' ? 'India' : cat}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
