/**
 * Every unit has one colour that identifies it everywhere (Home page, bottom
 * bar), so a unit can be recognized without reading its name. The colours are
 * readable on light and dark backgrounds.
 */
const UNIT_COLORS = [
  '#2563eb', '#d97706', '#0d9488', '#9333ea', '#db2777', '#65a30d'
]

/** The colour of the unit at `index` (starting with 0) */
export function unitColor(index: number): string {
  return UNIT_COLORS[((index % UNIT_COLORS.length) + UNIT_COLORS.length)
    % UNIT_COLORS.length]
}

/** Short label of a unit: its position, e.g. `U1` */
export function unitLabel(index: number): string {
  return `U${index + 1}`
}
