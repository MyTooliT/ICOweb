function emptyOrNull(value: string): boolean {
  return value === null || value === '';
}

export function matchExactOrEmpty(value: string, regex: RegExp): boolean {
  if (emptyOrNull(value)) return true;
  else return matchExact(value, regex);
}

export function matchExact(value: string, regex: RegExp): boolean {
  const match = value.match(regex);
  if(!match) return false;
  return match && value === match[0];
}

export function matchAny(value: string, regex: RegExp): boolean {
  const match = value.match(regex);
  if(!match) return false;
  return match && match.length > 0;
}