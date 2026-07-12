import React from "react";

const STATUS_MAP = {
  Active: "badge-success",
  Present: "badge-success",
  Inactive: "badge-neutral",
  Absent: "badge-danger",
  "Half Day": "badge-warning",
  "On Leave": "badge-warning",
};

export default function StatusBadge({ status }) {
  const cls = STATUS_MAP[status] || "badge-neutral";
  return <span className={`badge ${cls}`}>{status}</span>;
}