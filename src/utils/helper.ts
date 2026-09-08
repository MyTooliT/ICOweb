export function findNextFree(arr: Array<number>) {
  let num = 1
  let available = false
  while(!available) {
    if(arr.includes(num)) {
      num++
    } else {
      available = true
    }
  }
  return num
}

export function formatFileSize(bytes: number): string {
  const units = ['bytes', 'kB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  // Convert the size to the appropriate unit
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  // Return formatted size with 1 decimal place
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function formatSupplyVoltage(value: unknown): string | null {
  if (value === undefined || value === null) return null
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num)) return null
  return `${num.toFixed(2)} V`
}

// Domain acronyms that should render upper-case in a generically-derived
// label (e.g. `adc_prescaler` -> "ADC Prescaler") instead of the default
// Title Case (`capitalize`) a plain snake_case split would otherwise give
// each word ("Adc Prescaler").
const LABEL_ACRONYMS = new Set(['adc', 'mac', 'stu', 'sth', 'id'])

/**
 * Turn a snake_case HDF5/metadata attribute key into a display label,
 * without needing a per-key lookup table - new attribute keys get a
 * reasonable label automatically. Only wording this generic transform
 * can't get right (the acronyms above) needs a rule at all.
 */
export function formatAttributeLabel(key: string): string {
  return key
      .split('_')
      .map(word => LABEL_ACRONYMS.has(word.toLowerCase())
          ? word.toUpperCase()
          : capitalizeWord(word))
      .join(' ')
}

function capitalizeWord(word: string): string {
  return word.length ? word[0].toUpperCase() + word.slice(1) : word
}

/**
 * Format an HDF5/metadata attribute value for display, based on a pattern
 * in its key rather than the exact key - so a new `*_voltage` field (say)
 * gets the same treatment as `start_supply_voltage` without adding a case
 * for it here.
 */
export function formatAttributeValue(key: string, value: unknown): string {
  if (key.endsWith('_voltage')) {
    return formatSupplyVoltage(value) ?? String(value)
  }
  return String(value)
}