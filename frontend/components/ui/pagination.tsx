// Copied from shadcn/ui documentation: https://ui.shadcn.com/docs/components/pagination

import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

export interface PaginationProps {
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, total, limit, onPageChange, className }: PaginationProps) {
  const pageCount = Math.ceil(total / limit);
  if (pageCount <= 1) return null;

  const getPages = () => {
    const pages = [];
    let start = Math.max(1, page - 2);
    let end = Math.min(pageCount, page + 2);
    if (page <= 3) end = Math.min(5, pageCount);
    if (page >= pageCount - 2) start = Math.max(1, pageCount - 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <nav
      className={cn('mt-6 flex items-center justify-center gap-1', className)}
      aria-label="Pagination"
    >
      <button
        className="rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous"
      >
        <ChevronLeft className="size-4" />
      </button>
      {getPages().map((p) => (
        <button
          key={p}
          className={cn(
            'rounded px-3 py-1 text-sm font-medium',
            p === page
              ? 'bg-red-600 text-white shadow'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'
          )}
          onClick={() => onPageChange(p)}
          aria-current={p === page ? 'page' : undefined}
        >
          {p}
        </button>
      ))}
      <button
        className="rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
        onClick={() => onPageChange(page + 1)}
        disabled={page === pageCount}
        aria-label="Next"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
