export function getStoredTheme() {
  const preference = localStorage.getItem('theme');
  return ['light', 'dark', 'system'].includes(preference) ? preference : 'system';
}

export function applyTheme(preference = getStoredTheme()) {
  const dark = preference === 'dark' || (preference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}

export function setTheme(preference) {
  localStorage.setItem('theme', preference);
  applyTheme(preference);
  window.dispatchEvent(new Event('projectops:theme-changed'));
}
