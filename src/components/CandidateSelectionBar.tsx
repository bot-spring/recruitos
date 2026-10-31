"use client";

import React from "react";
import { CheckSquare, Square, ArrowUpDown, X, Trash2, Filter } from "lucide-react";

export type CandidateSortOption =
  | "createdAt_desc"
  | "updatedAt_desc"
  | "exp_desc"
  | "name_asc";

export interface CandidateFilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface CandidateSelectionBarProps {
  totalCount: number;
  selectedCount: number;
  isAllSelected: boolean;
  onToggleSelectAll: () => void;
  onClearSelection: () => void;
  sortBy?: CandidateSortOption;
  onSortChange?: (newSort: CandidateSortOption) => void;
  filterOptions?: CandidateFilterOption[];
  activeFilter?: string;
  onFilterChange?: (newFilter: string) => void;
  onBulkDelete?: () => void;
  bulkDeleteLabel?: string;
  onBulkRemove?: () => void;
  bulkRemoveLabel?: string;
}

export function CandidateSelectionBar({
  totalCount,
  selectedCount,
  isAllSelected,
  onToggleSelectAll,
  onClearSelection,
  sortBy,
  onSortChange,
  filterOptions,
  activeFilter,
  onFilterChange,
  onBulkDelete,
  bulkDeleteLabel = "Delete Selected",
  onBulkRemove,
  bulkRemoveLabel = "Remove from Mandate",
}: CandidateSelectionBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 bg-white rounded-lg border border-slate-200 shadow-xs">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSelectAll}
          className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors focus:outline-hidden cursor-pointer"
          title={isAllSelected ? "Deselect all visible candidates" : "Select all visible candidates"}
        >
          {isAllSelected ? (
            <CheckSquare className="w-4 h-4 text-slate-900" />
          ) : (
            <Square className="w-4 h-4 text-slate-400" />
          )}
          <span>
            Showing <strong className="text-slate-900">{totalCount}</strong> candidate
            {totalCount !== 1 ? "s" : ""}
          </span>
        </button>

        {selectedCount > 0 && (
          <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-white shadow-2xs">
              {selectedCount} selected
            </span>

            {onBulkRemove && (
              <button
                type="button"
                onClick={onBulkRemove}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors shadow-2xs cursor-pointer"
                title={bulkRemoveLabel}
              >
                <span>{bulkRemoveLabel}</span>
              </button>
            )}

            {onBulkDelete && (
              <button
                type="button"
                onClick={onBulkDelete}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors shadow-2xs cursor-pointer"
                title={bulkDeleteLabel}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>{bulkDeleteLabel}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClearSelection}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center gap-1 cursor-pointer"
              title="Clear selection"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Filters & Sorting Controls */}
      <div className="flex flex-wrap items-center gap-3 ml-auto text-xs">
        {filterOptions && filterOptions.length > 0 && onFilterChange && (
          <div className="flex items-center gap-1.5 text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-medium text-slate-500">Filter:</span>
            <select
              value={activeFilter || "ALL"}
              onChange={(e) => onFilterChange(e.target.value)}
              aria-label="Filter candidates by pipeline stage"
              className="text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md px-2.5 py-1 pr-6 focus:outline-hidden focus:ring-1 focus:ring-slate-900 transition-colors cursor-pointer"
            >
              {filterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}{opt.count !== undefined ? ` (${opt.count})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sorting Dropdown */}
        {sortBy && onSortChange && (
          <div className="flex items-center gap-1.5 text-slate-500">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-medium text-slate-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as CandidateSortOption)}
              aria-label="Sort candidates by"
              className="text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md px-2 py-1 pr-6 focus:outline-hidden focus:ring-1 focus:ring-slate-900 transition-colors cursor-pointer"
            >
              <option value="createdAt_desc">Date Added (Newest)</option>
              <option value="updatedAt_desc">Recently Active</option>
              <option value="exp_desc">Experience: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

