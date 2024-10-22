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