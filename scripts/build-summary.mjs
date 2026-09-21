import fs from 'node:fs'
import path from 'node:path'

const source = process.argv[2]
const output = process.argv[3]

if (!source || !output) {
  throw new Error('Usage: node scripts/build-summary.mjs <csv> <json>')
}

const csv = fs.readFileSync(source, 'utf8')
const lines = csv.split(/\r?\n/).filter(Boolean)
const header = lines.shift().split(',')
const idx = Object.fromEntries(header.map((key, index) => [key, index]))

const parseCsvLine = (line) => {
  const cells = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        cell += '"'
        i += 1
      } else {
        quoted = !quoted
      }
    } else if (char === ',' && !quoted) {
      cells.push(cell)
      cell = ''
    } else {
      cell += char
    }
  }
  cells.push(cell)
  return cells
}

const clean = (value) => value.replace(/\s+/g, '').trim()
const toNumber = (value) => Number(String(value).replace(/[^0-9.-]/g, '')) || 0
const categoryOrder = ['편의점', '슈퍼마켓', '대형할인점', '일반한식', '서양음식', '중국음식', '일식회집', '스넥', '제과점', '갈비전문점', '한정식']
const regionMap = new Map()
const sidoMap = new Map()
const monthlyMap = new Map()

for (const line of lines) {
  const row = parseCsvLine(line)
  if (row[idx.AGE_CD] !== '3') continue

  const sido = row[idx.SIDO_NM]
  const district = row[idx.CCG_NM]
  const category = clean(row[idx.TP_BUZ_NM])
  const month = row[idx.STRD_YYMM]
  const amt = toNumber(row[idx.amt])
  const cnt = toNumber(row[idx.cnt])
  const key = `${sido}||${district}`
  if (!regionMap.has(key)) {
    regionMap.set(key, {
      sido,
      district,
      totalAmt: 0,
      totalCnt: 0,
      categories: {},
      monthly: {},
    })
  }
  const region = regionMap.get(key)
  region.totalAmt += amt
  region.totalCnt += cnt
  region.categories[category] ??= { amt: 0, cnt: 0 }
  region.categories[category].amt += amt
  region.categories[category].cnt += cnt
  region.monthly[month] ??= { amt: 0, cnt: 0 }
  region.monthly[month].amt += amt
  region.monthly[month].cnt += cnt

  if (!monthlyMap.has(month)) monthlyMap.set(month, { amt: 0, cnt: 0 })
  monthlyMap.get(month).amt += amt
  monthlyMap.get(month).cnt += cnt
  sidoMap.set(sido, (sidoMap.get(sido) ?? new Set()).add(district))
}

const toRegion = (region) => ({
  sido: region.sido,
  district: region.district,
  totalAmt: region.totalAmt,
  totalCnt: region.totalCnt,
  avgTicket: region.totalCnt ? Math.round(region.totalAmt / region.totalCnt) : 0,
  categories: Object.fromEntries(Object.entries(region.categories).map(([name, value]) => [name, value])),
  monthly: Object.entries(region.monthly)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({ month, ...value })),
})

const regions = [...regionMap.values()].map(toRegion)
const latestMonths = [...monthlyMap.keys()].sort().slice(-6)
const summary = {
  generatedAt: new Date().toISOString(),
  source: 'ABP_CONTEST_DATA.csv',
  ageCode: '3',
  ageLabel: '20대',
  categories: categoryOrder,
  latestMonths,
  sidos: [...sidoMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'ko'))
    .map(([name, districts]) => ({ name, districts: [...districts].sort((a, b) => a.localeCompare(b, 'ko')) })),
  regions,
  monthly: latestMonths.map((month) => ({ month, ...monthlyMap.get(month) })),
  sourceRows: lines.length,
  filteredRows: regions.length,
}

fs.mkdirSync(path.dirname(output), { recursive: true })
fs.writeFileSync(output, JSON.stringify(summary))
console.log(JSON.stringify({ regions: regions.length, months: latestMonths, bytes: fs.statSync(output).size }))
