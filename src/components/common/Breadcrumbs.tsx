import React from 'react';

interface BreadcrumbsProps {
  items: { label: string; href?: string }[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            {index > 0 && <span className="text-gray-300">/</span>}
            {isLast ? (
              <span className="font-semibold text-gray-800">{item.label}</span>
            ) : (
              <span className="hover:text-gray-700 transition">{item.label}</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

