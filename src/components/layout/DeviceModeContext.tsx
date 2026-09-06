"use client";

import React, { createContext, useContext } from "react";
import { DevicePreviewMode } from "@/components/layout/DeviceSwitcher";

export interface DeviceModeContextType {
  deviceMode: DevicePreviewMode;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export const DeviceModeContext = createContext<DeviceModeContextType>({
  deviceMode: "desktop",
  isMobile: false,
  isTablet: false,
  isDesktop: true,
});

export function useDeviceMode() {
  return useContext(DeviceModeContext);
}
