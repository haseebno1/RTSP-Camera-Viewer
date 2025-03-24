import { useState, useCallback } from "react";

export type ViewMode = "360" | "180" | "quad" | "vr";
export type StreamQuality = "high" | "low";
export type RenderingQuality = "high" | "balanced" | "performance";

export interface CameraSettings {
  // View settings
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  
  // Dewarp toggle
  isDewarpEnabled: boolean;
  toggleDewarp: () => void;
  
  // Image adjustments
  brightness: number;
  setBrightness: (value: number) => void;
  
  contrast: number;
  setContrast: (value: number) => void;
  
  saturation: number;
  setSaturation: (value: number) => void;
  
  // Mode toggles
  isNightModeEnabled: boolean;
  toggleNightMode: () => void;
  
  isBWModeEnabled: boolean;
  toggleBWMode: () => void;
  
  isAutoExposureEnabled: boolean;
  toggleAutoExposure: () => void;
  
  // Stream settings
  streamQuality: StreamQuality;
  setStreamQuality: (quality: StreamQuality) => void;
  
  renderingQuality: RenderingQuality;
  setRenderingQuality: (quality: RenderingQuality) => void;
  
  // Reset all settings
  resetToDefaults: () => void;
}

export function useCameraSettings(): CameraSettings {
  // View settings
  const [viewMode, setViewMode] = useState<ViewMode>("360");
  
  // Dewarp toggle
  const [isDewarpEnabled, setIsDewarpEnabled] = useState(false);
  const toggleDewarp = useCallback(() => {
    setIsDewarpEnabled((prev) => !prev);
  }, []);
  
  // Image adjustments
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  
  // Mode toggles
  const [isNightModeEnabled, setIsNightModeEnabled] = useState(false);
  const toggleNightMode = useCallback(() => {
    setIsNightModeEnabled((prev) => !prev);
  }, []);
  
  const [isBWModeEnabled, setIsBWModeEnabled] = useState(false);
  const toggleBWMode = useCallback(() => {
    setIsBWModeEnabled((prev) => !prev);
  }, []);
  
  const [isAutoExposureEnabled, setIsAutoExposureEnabled] = useState(true);
  const toggleAutoExposure = useCallback(() => {
    setIsAutoExposureEnabled((prev) => !prev);
  }, []);
  
  // Stream settings
  const [streamQuality, setStreamQuality] = useState<StreamQuality>("high");
  const [renderingQuality, setRenderingQuality] = useState<RenderingQuality>("balanced");
  
  // Reset all settings to defaults
  const resetToDefaults = useCallback(() => {
    setViewMode("360");
    setIsDewarpEnabled(false);
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setIsNightModeEnabled(false);
    setIsBWModeEnabled(false);
    setIsAutoExposureEnabled(true);
    setStreamQuality("high");
    setRenderingQuality("balanced");
  }, []);
  
  return {
    viewMode,
    setViewMode,
    isDewarpEnabled,
    toggleDewarp,
    brightness,
    setBrightness,
    contrast,
    setContrast,
    saturation,
    setSaturation,
    isNightModeEnabled,
    toggleNightMode,
    isBWModeEnabled,
    toggleBWMode,
    isAutoExposureEnabled,
    toggleAutoExposure,
    streamQuality,
    setStreamQuality,
    renderingQuality,
    setRenderingQuality,
    resetToDefaults
  };
}
