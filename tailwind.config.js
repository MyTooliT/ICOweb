/** @type {import('tailwindcss').Config} */
import basePreset from './src/base/configuration/tailwind.preset.js';

export default {
  presets: [basePreset],
  content: ['./src/**/*.{html,js,vue}'],
}
