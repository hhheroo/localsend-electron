export const Device = {
  MOBILE: 'mobile',
  DESKTOP: 'desktop',
  WEB: 'web',
  HEADLESS: 'headless',
  SERVER: 'server'
} as const;

export type Device = (typeof Device)[keyof typeof Device];
