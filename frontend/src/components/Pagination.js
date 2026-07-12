import React from "react";

export default function Pagination({ page, totalPages, totalItems, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <span>
        Page {page} of {totalPages} &middot; {totalItems} total
      </span>
      <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Prev
      </button>
      <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        Next
      </button>
    </div>
  );
}