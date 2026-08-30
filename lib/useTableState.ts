import { useState, useCallback, useMemo } from 'react';

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  [key: string]: string | string[] | boolean | number | null;
}

export interface PaginationConfig {
  currentPage: number;
  pageSize: number;
  totalItems: number;
}

export function useTableState<T extends Record<string, any>>(
  data: T[],
  options?: {
    initialPageSize?: number;
    searchableFields?: string[];
  }
) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [filters, setFilters] = useState<FilterConfig>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = options?.initialPageSize || 10;
  const searchableFields = options?.searchableFields || [];

  // Filter data based on filters
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = searchableFields.some((field) => {
          const value = String(item[field] || '').toLowerCase();
          return value.includes(query);
        });
        if (!matchesSearch) return false;
      }

      // Apply other filters
      for (const [key, value] of Object.entries(filters)) {
        if (value === null || value === '') continue;

        const itemValue = item[key];

        if (Array.isArray(value)) {
          if (!value.includes(itemValue)) return false;
        } else if (typeof value === 'boolean') {
          if (itemValue !== value) return false;
        } else if (typeof value === 'number') {
          if (itemValue !== value) return false;
        } else {
          if (String(itemValue).toLowerCase() !== String(value).toLowerCase()) {
            return false;
          }
        }
      }

      return true;
    });
  }, [data, filters, searchQuery, searchableFields]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        return sortConfig.direction === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      // Fallback to string comparison
      const aStr = String(aValue);
      const bStr = String(bValue);
      return sortConfig.direction === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });

    return sorted;
  }, [filteredData, sortConfig]);

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = useCallback((key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
    setCurrentPage(1); // Reset to first page
  }, []);

  const handleFilter = useCallback((key: string, value: any) => {
    setFilters((current) => ({
      ...current,
      [key]: value === '' ? null : value,
    }));
    setCurrentPage(1); // Reset to first page
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
    setSortConfig(null);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  return {
    // Data
    paginatedData,
    filteredData,
    sortedData,

    // State
    sortConfig,
    filters,
    searchQuery,
    currentPage,
    pageSize,
    totalPages,
    totalItems: sortedData.length,

    // Handlers
    handleSort,
    handleFilter,
    handleSearch,
    handleClearFilters,
    handlePageChange,
  };
}
