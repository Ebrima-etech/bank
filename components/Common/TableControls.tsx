import React from 'react';
import { BiSearch, BiX } from 'react-icons/bi';

interface TableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function TableSearch({ value, onChange, placeholder = 'Search...' }: TableSearchProps) {
  return (
    <div className="relative">
      <BiSearch className="absolute left-3 top-3 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
        >
          <BiX size={20} />
        </button>
      )}
    </div>
  );
}

interface FilterOption {
  label: string;
  value: string | number | boolean;
}

interface TableFilterProps {
  label: string;
  value: string | string[] | null;
  options: FilterOption[];
  onChange: (value: any) => void;
  multi?: boolean;
}

export function TableFilter({ label, value, options, onChange, multi = false }: TableFilterProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {multi ? (
        <div className="space-y-2">
          {options.map((option) => (
            <label key={option.value} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={Array.isArray(value) && value.includes(String(option.value))}
                onChange={(e) => {
                  const currentValues = Array.isArray(value) ? value : [];
                  if (e.target.checked) {
                    onChange([...currentValues, String(option.value)]);
                  } else {
                    onChange(currentValues.filter((v) => v !== String(option.value)));
                  }
                }}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 cursor-pointer"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      ) : (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none cursor-pointer"
        >
          <option value="">All</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSort?: { key: string; direction: 'asc' | 'desc' } | null;
  onSort: (key: string) => void;
  className?: string;
}

export function SortableHeader({
  label,
  sortKey,
  currentSort,
  onSort,
  className = '',
}: SortableHeaderProps) {
  const isActive = currentSort?.key === sortKey;
  const icon = isActive ? (currentSort.direction === 'asc' ? '↑' : '↓') : '⇅';

  return (
    <th className={`px-6 py-3 text-left cursor-pointer hover:bg-gray-50 ${className}`}>
      <button
        onClick={() => onSort(sortKey)}
        className="flex items-center gap-2 font-semibold text-gray-900 hover:text-primary-600 transition-colors"
      >
        {label}
        <span className={`text-sm ${isActive ? 'text-primary-600' : 'text-gray-400'}`}>
          {icon}
        </span>
      </button>
    </th>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export function TablePagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-200">
      <div className="text-sm text-gray-600">
        Showing <span className="font-medium">{startItem}</span> to{' '}
        <span className="font-medium">{endItem}</span> of{' '}
        <span className="font-medium">{totalItems}</span> results
      </div>

      <div className="flex items-center gap-4">
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Per page:</label>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded text-sm cursor-pointer"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm font-medium"
          >
            ← Prev
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`px-2 py-1 rounded text-sm font-medium ${
                    currentPage === pageNum
                      ? 'bg-primary-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm font-medium"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

interface TableControlsWrapperProps {
  title?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: React.ReactNode;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  children: React.ReactNode;
}

export function TableControlsWrapper({
  title,
  searchValue,
  onSearchChange,
  filters,
  onClearFilters,
  hasActiveFilters,
  children,
}: TableControlsWrapperProps) {
  return (
    <div className="space-y-4">
      {/* Title and Clear Filters */}
      {(title || hasActiveFilters) && (
        <div className="flex items-center justify-between">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <TableSearch value={searchValue} onChange={onSearchChange} />
        {filters}
      </div>

      {/* Table */}
      {children}
    </div>
  );
}
