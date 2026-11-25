/**
 * Brand & Primary Color Management System for Allié
 * Handles dynamic CSS variables, soft selection tint computation,
 * persistence in localStorage and real-time cross-component synchronization.
 */

export const DEFAULT_PRIMARY_COLOR = '#6434df';

export const PRESET_PRIMARY_COLORS = [
  { id: 'purple',  name: 'Allié Purple',   color: '#6434df', desc: 'Original iconic neo-brutalist purple' },
  { id: 'indigo',  name: 'Electric Indigo',color: '#4f46e5', desc: 'Vibrant modern tech indigo' },
  { id: 'blue',    name: 'Ocean Blue',     color: '#2563eb', desc: 'Crisp corporate oceanic blue' },
  { id: 'teal',    name: 'Cyber Cyan',     color: '#0891b2', desc: 'Fresh high-energy teal accent' },
  { id: 'emerald', name: 'Emerald Mint',   color: '#059669', desc: 'Organic lush emerald green' },
  { id: 'amber',   name: 'Warm Amber',     color: '#d97706', desc: 'Warm inviting sunny amber' },
  { id: 'orange',  name: 'Sunset Coral',   color: '#ea580c', desc: 'Bold punchy neo sunset orange' },
  { id: 'rose',    name: 'Ruby Rose',      color: '#e11d48', desc: 'Energetic vibrant ruby red' },
  { id: 'pink',    name: 'Berry Fuchsia',  color: '#c026d3', desc: 'Playful vivid neo-pop pink' },
  { id: 'dark',    name: 'Obsidian Black', color: '#18181b', desc: 'Ultra-minimal monochrome dark' },
];

/**
 * Validates 3-digit or 6-digit hex color string
 */
export function isValidHex(hex) {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex);
}

/**
 * Computes a soft pastel background tint (selection color) from any primary hex
 * Blends approx 12% of the brand color with 88% white.
 */
export function getSelectionTint(hex) {
  if (!isValidHex(hex)) return '#f1ebff';
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;

  const blend = (channel) => Math.round(channel * 0.12 + 255 * 0.88);
  const tr = blend(r).toString(16).padStart(2, '0');
  const tg = blend(g).toString(16).padStart(2, '0');
  const tb = blend(b).toString(16).padStart(2, '0');
  return `#${tr}${tg}${tb}`;
}

/**
 * Computes a slightly deepened tone for button active or hover borders
 */
export function getHoverShade(hex) {
  if (!isValidHex(hex)) return '#4f24b8';
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  const r = Math.max(0, Math.round(((num >> 16) & 255) * 0.85));
  const g = Math.max(0, Math.round(((num >> 8) & 255) * 0.85));
  const b = Math.max(0, Math.round((num & 255) * 0.85));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Retrieves the currently configured primary color from localStorage, or default
 */
export function getSavedPrimaryColor() {
  if (typeof window === 'undefined') return DEFAULT_PRIMARY_COLOR;
  const saved = localStorage.getItem('allie_primary_color');
  return (saved && isValidHex(saved)) ? saved : DEFAULT_PRIMARY_COLOR;
}

/**
 * Dynamically applies primary color and its computed tints to CSS variables on documentElement
 */
export function applyPrimaryColor(color, { save = true } = {}) {
  if (typeof window === 'undefined') return;
  const hex = (isValidHex(color) ? color : DEFAULT_PRIMARY_COLOR).toLowerCase();
  const selectionTint = getSelectionTint(hex);
  const hoverColor = getHoverShade(hex);

  const root = document.documentElement;
  root.style.setProperty('--dp-color-accent', hex);
  root.style.setProperty('--dp-color-selection', selectionTint);
  root.style.setProperty('--dp-color-accent-hover', hoverColor);

  if (save) {
    try {
      localStorage.setItem('allie_primary_color', hex);
    } catch {
      // LocalStorage access may fail in restricted iframes
    }
  }

  // Notify listeners across components
  window.dispatchEvent(new CustomEvent('allie_theme_updated', {
    detail: { color: hex, selectionTint, hoverColor }
  }));

  return { color: hex, selectionTint, hoverColor };
}

/**
 * Initializes the theme on page startup before React renders
 */
export function initTheme() {
  const saved = getSavedPrimaryColor();
  applyPrimaryColor(saved, { save: false });
}
