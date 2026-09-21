export function getRisk(region) {
  if (!region) return 0
  const convenience = region.categories?.편의점?.amt ?? 0
  const fresh = (region.categories?.슈퍼마켓?.amt ?? 0) + (region.categories?.대형할인점?.amt ?? 0)
  return Math.round((convenience / Math.max(convenience + fresh, 1)) * 100)
}

export function riskTone(value) {
  if (value >= 65) return 'critical'
  if (value >= 50) return 'watch'
  return 'stable'
}

export function riskLabel(value) {
  if (value >= 65) return '취약'
  if (value >= 50) return '관찰'
  return '안정'
}
