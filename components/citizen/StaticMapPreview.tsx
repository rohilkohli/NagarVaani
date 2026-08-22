'use client';

import React from 'react';
import RealCitizenMap from './RealCitizenMap';

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
  return <RealCitizenMap {...props} />;
}
