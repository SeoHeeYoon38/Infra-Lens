export function formatWon(value) {
  if (!value) return '0원'
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}억`
  if (value >= 10000) return `${Math.round(value / 10000).toLocaleString()}만`
  return `${Math.round(value).toLocaleString()}원`
}

export function formatCount(value) {
  if (!value) return '0'
  if (value >= 10000) return `${(value / 10000).toFixed(1)}만`
  return Math.round(value).toLocaleString()
}

export function formatMonth(month) {
  return month ? `${month.slice(0, 4)}.${month.slice(4)}` : ''
}
