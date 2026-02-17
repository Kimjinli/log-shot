/**
 * Global Type Definitions
 */

// Extend Window for PWA
interface Window {
  workbox?: any;
}

// Extend Navigator for Camera API
interface Navigator {
  canShare?: (data: ShareData) => boolean;
}

// Service Worker types
interface ServiceWorkerGlobalScope {
  __WB_MANIFEST: any;
}

// Module declarations for libraries without types
declare module 'exif-js' {
  export function getData(img: any, callback: Function): void;
  export function getTag(img: any, tag: string): any;
  export function getAllTags(img: any): any;
}
