/** Lightweight User-Agent parser — just enough to label a visitor notification. */
export function parseUserAgent(ua: string): { browser: string; os: string } {
  let browser = 'Unknown';
  if (/EdgA?\//.test(ua)) browser = 'Edge';
  else if (/OPR\//.test(ua)) browser = 'Opera';
  else if (/SamsungBrowser/.test(ua)) browser = 'Samsung Internet';
  else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) browser = 'Chrome';
  else if (/CriOS\//.test(ua)) browser = 'Chrome (iOS)';
  else if (/FxiOS\//.test(ua)) browser = 'Firefox (iOS)';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Version\/.*Safari\//.test(ua)) browser = 'Safari';

  let os = 'Unknown';
  if (/Windows/.test(ua)) os = 'Windows';
  else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/Mac OS X/.test(ua)) os = 'macOS';
  else if (/Linux/.test(ua)) os = 'Linux';

  return { browser, os };
}
