/**
 * Device detection utilities for responsive design
 * Provides functions to detect device types, capabilities, and characteristics
 */

/**
 * User agent patterns for device detection
 */
const DEVICE_PATTERNS = {
  mobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i,
  tablet: /iPad|Android(?!.*Mobile)|Kindle|Silk/i,
  ios: /iPhone|iPad|iPod/i,
  android: /Android/i,
  chrome: /Chrome/i,
  safari: /Safari/i,
  firefox: /Firefox/i,
  edge: /Edge/i,
} as const;

/**
 * Device type enumeration
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * Browser type enumeration
 */
export type BrowserType = 'chrome' | 'safari' | 'firefox' | 'edge' | 'unknown';

/**
 * Operating system type enumeration
 */
export type OSType =
  | 'ios'
  | 'android'
  | 'windows'
  | 'macos'
  | 'linux'
  | 'unknown';

/**
 * Device information interface
 */
export interface DeviceInfo {
  type: DeviceType;
  browser: BrowserType;
  os: OSType;
  isTouchDevice: boolean;
  supportsHover: boolean;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  isHighDPI: boolean;
  isOnline: boolean;
}

/**
 * Detect device type based on user agent and screen size
 */
export function getDeviceType(): DeviceType {
  if (typeof window === 'undefined') {
    return 'desktop';
  }

  const userAgent = navigator.userAgent;
  const screenWidth = window.screen.width;

  // Check user agent patterns
  if (DEVICE_PATTERNS.mobile.test(userAgent)) {
    // Further distinguish between mobile and tablet based on screen size
    if (DEVICE_PATTERNS.tablet.test(userAgent) || screenWidth >= 768) {
      return 'tablet';
    }
    return 'mobile';
  }

  // Fallback to screen size detection
  if (screenWidth < 768) {
    return 'mobile';
  }
  if (screenWidth < 1024) {
    return 'tablet';
  }

  return 'desktop';
}

/**
 * Detect browser type
 */
export function getBrowserType(): BrowserType {
  if (typeof window === 'undefined') {
    return 'unknown';
  }

  const userAgent = navigator.userAgent;

  if (DEVICE_PATTERNS.chrome.test(userAgent)) {
    return 'chrome';
  }
  if (
    DEVICE_PATTERNS.safari.test(userAgent) &&
    !DEVICE_PATTERNS.chrome.test(userAgent)
  ) {
    return 'safari';
  }
  if (DEVICE_PATTERNS.firefox.test(userAgent)) {
    return 'firefox';
  }
  if (DEVICE_PATTERNS.edge.test(userAgent)) {
    return 'edge';
  }

  return 'unknown';
}

/**
 * Detect operating system
 */
export function getOSType(): OSType {
  if (typeof window === 'undefined') {
    return 'unknown';
  }

  const userAgent = navigator.userAgent;

  if (DEVICE_PATTERNS.ios.test(userAgent)) {
    return 'ios';
  }
  if (DEVICE_PATTERNS.android.test(userAgent)) {
    return 'android';
  }
  if (/Windows/i.test(userAgent)) {
    return 'windows';
  }
  if (/Mac/i.test(userAgent)) {
    return 'macos';
  }
  if (/Linux/i.test(userAgent)) {
    return 'linux';
  }

  return 'unknown';
}

/**
 * Check if device supports touch
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - Legacy property
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Check if device supports hover
 */
export function supportsHover(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

/**
 * Check if device has high DPI display
 */
export function isHighDPI(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.devicePixelRatio > 1 ||
    window.matchMedia('(-webkit-min-device-pixel-ratio: 1.5)').matches ||
    window.matchMedia('(min-resolution: 144dpi)').matches
  );
}

/**
 * Get comprehensive device information
 */
export function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      type: 'desktop',
      browser: 'unknown',
      os: 'unknown',
      isTouchDevice: false,
      supportsHover: true,
      screenWidth: 1920,
      screenHeight: 1080,
      pixelRatio: 1,
      isHighDPI: false,
      isOnline: true,
    };
  }

  return {
    type: getDeviceType(),
    browser: getBrowserType(),
    os: getOSType(),
    isTouchDevice: isTouchDevice(),
    supportsHover: supportsHover(),
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    pixelRatio: window.devicePixelRatio || 1,
    isHighDPI: isHighDPI(),
    isOnline: navigator.onLine,
  };
}

/**
 * Check if device is mobile (phone)
 */
export function isMobileDevice(): boolean {
  return getDeviceType() === 'mobile';
}

/**
 * Check if device is tablet
 */
export function isTabletDevice(): boolean {
  return getDeviceType() === 'tablet';
}

/**
 * Check if device is desktop
 */
export function isDesktopDevice(): boolean {
  return getDeviceType() === 'desktop';
}

/**
 * Check if device is iOS
 */
export function isIOSDevice(): boolean {
  return getOSType() === 'ios';
}

/**
 * Check if device is Android
 */
export function isAndroidDevice(): boolean {
  return getOSType() === 'android';
}

/**
 * Get safe area insets for devices with notches (iOS Safari)
 */
export function getSafeAreaInsets() {
  if (typeof window === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const style = getComputedStyle(document.documentElement);

  return {
    top: parseInt(
      style.getPropertyValue('env(safe-area-inset-top)') || '0',
      10
    ),
    right: parseInt(
      style.getPropertyValue('env(safe-area-inset-right)') || '0',
      10
    ),
    bottom: parseInt(
      style.getPropertyValue('env(safe-area-inset-bottom)') || '0',
      10
    ),
    left: parseInt(
      style.getPropertyValue('env(safe-area-inset-left)') || '0',
      10
    ),
  };
}

/**
 * Check if device prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if device prefers dark color scheme
 */
export function prefersDarkMode(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Get network connection information
 */
export function getNetworkInfo() {
  if (typeof window === 'undefined' || !('connection' in navigator)) {
    return {
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0,
      saveData: false,
    };
  }

  // Connection API is not fully standardized across browsers
  interface ExtendedNavigator extends Navigator {
    connection?: {
      effectiveType?: string;
      downlink?: number;
      rtt?: number;
      saveData?: boolean;
    };
    mozConnection?: {
      effectiveType?: string;
      downlink?: number;
      rtt?: number;
      saveData?: boolean;
    };
    webkitConnection?: {
      effectiveType?: string;
      downlink?: number;
      rtt?: number;
      saveData?: boolean;
    };
  }

  const extendedNavigator = navigator as ExtendedNavigator;
  const connection =
    extendedNavigator.connection ||
    extendedNavigator.mozConnection ||
    extendedNavigator.webkitConnection;

  return {
    effectiveType: connection?.effectiveType || 'unknown',
    downlink: connection?.downlink || 0,
    rtt: connection?.rtt || 0,
    saveData: connection?.saveData || false,
  };
}

/**
 * Check if connection is slow (2G or slow 3G)
 */
export function isSlowConnection(): boolean {
  const { effectiveType } = getNetworkInfo();
  return effectiveType === '2g' || effectiveType === 'slow-2g';
}

/**
 * Add device-specific CSS classes to document element
 */
export function addDeviceClasses(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const deviceInfo = getDeviceInfo();
  const classes = [
    `device-${deviceInfo.type}`,
    `browser-${deviceInfo.browser}`,
    `os-${deviceInfo.os}`,
    deviceInfo.isTouchDevice ? 'touch' : 'no-touch',
    deviceInfo.supportsHover ? 'hover' : 'no-hover',
    deviceInfo.isHighDPI ? 'high-dpi' : 'standard-dpi',
    deviceInfo.isOnline ? 'online' : 'offline',
  ];

  document.documentElement.classList.add(...classes);
}

/**
 * Remove device-specific CSS classes from document element
 */
export function removeDeviceClasses(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const deviceInfo = getDeviceInfo();
  const classes = [
    `device-${deviceInfo.type}`,
    `browser-${deviceInfo.browser}`,
    `os-${deviceInfo.os}`,
    'touch',
    'no-touch',
    'hover',
    'no-hover',
    'high-dpi',
    'standard-dpi',
    'online',
    'offline',
  ];

  document.documentElement.classList.remove(...classes);
}
