/**
 * The Material colour tokens, the custom utilities and the PrimeUI plugin all
 * come from the ICOClientBase preset; this file only declares what to scan.
 *
 * @type {import('tailwindcss').Config}
 */
import basePreset from './src/base/configuration/tailwind.preset.js';

export default {
  presets: [basePreset],
  content: ['./index.html', './src/**/*.{html,js,ts,vue}'],
};
