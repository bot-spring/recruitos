"use client";

import React from "react";
import { CheckSquare, Square, ArrowUpDown, X } from "lucide-react";

export type CandidateSortOption =
  | "createdAt_desc"
  | "updatedAt_desc"
  | "exp_desc"
  | "name_asc";

export interface CandidateSelectionBarProps {
  totalCount: number;
  selectedCount: number;
  isAllSelected: boolean;
  onToggleSelectAll: () => void;
  onClearSelection: () => void;
  sortBy: CandidateSortOption;
  onSortChange: (newSort: CandidateSortOption) => void;
}

export function CandidateSelectionBar({
  totalCount,
  selectedCount,
  isAllSelected,
  onToggleSelectAll,
  onClearSelection,
  sortBy,
  onSortChange,
}: CandidateSelectionBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 bg-white rounded-lg border border-slate-200 shadow-xs">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSelectAll}
          className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors focus:outline-hidden"
          title={isAllSelected ? "Deselect all visible candidates" : "Select all visible candidates"}
        >
          {isAllSelected ? (
            <CheckSquare className="w-4 h-4 text-emerald-600" />
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
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {selectedCount} selected
            </span>
            <button
              type="button"
              onClick={onClearSelection}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center gap-1"
              title="Clear selection"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Sorting Dropdown */}
      <div className="flex items-center gap-1.5 ml-auto text-xs text-slate-500">
        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="font-medium text-slate-500">Sort by:</span>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as CandidateSortOption)}
          aria-label="Sort candidates by"
          className="text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md px-2 py-1 pr-6 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 transition-colors cursor-pointer"
        >
          <option value="createdAt_desc">Date Added (Newest)</option>
          <option value="updatedAt_desc">Recently Active</option>
          <option value="exp_desc">Experience: High to Low</option>
          <option value="name_asc">Name: A to Z</option>
        </select>
      </div>
    </div>
  );
}

