'use client';

import React, { lazy, Suspense } from 'react';

const RealCitizenMap = lazy(() => import('./RealCitizenMap'));

interface StaticMapPreviewProps {
  country: string;
  state?: string;
  district?: string;
  landmark?: string;
  customCoords?: { lat: number; lng: number } | null;
  onCoordinatesChange?: (coords: { lat: number; lng: number }) => void;
  onDistrictDetected?: (detected: { country: string; state: string; district: string }) => void;
  isLocating?: boolean;
  onDetectLocation?: () => void;
  className?: string;
}

export default function StaticMapPreview(props: StaticMapPreviewProps) {
  return (
    <Suspense fallback={<div className="w-full h-[220px] skeleton-shimmer rounded-[14px]" />}>
      <RealCitizenMap {...props} />
    </Suspense>
  );
}
