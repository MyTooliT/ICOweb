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
  const units = ["bytes", "kB", "MB", "GB", "TB"];
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