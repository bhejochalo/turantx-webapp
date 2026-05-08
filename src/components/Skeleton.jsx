import React from "react";
import "./Skeleton.css";

export function SkeletonLine({ width = "100%", height = "14px" }) {
  return <div className="skeleton-line" style={{ width, height }} />;
}

export function SkeletonCircle({ size = "40px" }) {
  return <div className="skeleton-circle" style={{ width: size, height: size }} />;
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <SkeletonLine width="60%" height="20px" />
      <SkeletonLine width="90%" />
      <SkeletonLine width="75%" />
      <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
        <SkeletonLine width="40%" height="36px" />
        <SkeletonLine width="40%" height="36px" />
      </div>
    </div>
  );
}

export function WaitlistSkeleton() {
  return (
    <div className="skeleton-waitlist">
      <SkeletonCircle size="90px" />
      <SkeletonLine width="70%" height="22px" />
      <SkeletonLine width="85%" />
      <SkeletonLine width="60%" />
      <div style={{ marginTop: "16px" }}>
        <SkeletonLine width="100%" height="48px" />
      </div>
      <div style={{ marginTop: "12px" }}>
        <SkeletonLine width="100%" height="180px" />
      </div>
      <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
        <SkeletonLine width="50%" height="36px" />
        <SkeletonLine width="50%" height="36px" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="skeleton-waitlist">
      <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px" }}>
        <SkeletonCircle size="48px" />
        <div style={{ flex: 1 }}>
          <SkeletonLine width="50%" height="18px" />
          <SkeletonLine width="30%" />
        </div>
      </div>
      <SkeletonLine width="100%" height="120px" />
      <div style={{ marginTop: "16px" }}>
        <SkeletonLine width="40%" height="18px" />
        <SkeletonLine width="100%" height="60px" />
        <SkeletonLine width="100%" height="60px" />
      </div>
    </div>
  );
}
