import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const summaryPath = path.join(rootDir, 'public', 'data', 'infra-lens-summary.json')
const nationalHouseholdPath = path.join(rootDir, 'public', 'data', 'kosis-single-households-2025.json')
const householdPath = path.join(rootDir, 'public', 'data', 'seoul-gangseo-single-households-20260731.json')
const nationalWastePath = path.join(rootDir, 'public', 'data', 'national-waste-2024.json')
const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'))
const nationalHouseholdDataset = fs.existsSync(nationalHouseholdPath)
  ? JSON.parse(fs.readFileSync(nationalHouseholdPath, 'utf8'))
  : { source: 'https://kosis.kr/statisticsList/mass/mass_list.jsp?list_id=&org_id=101&process=statHtml&tbl_id=DT_1PL1502&vw_cd=', dataset: '성 및 연령별 1인가구 - 시군구', year: null, scope: '전국·시군구', regions: [] }
const householdDataset = fs.existsSync(householdPath)
  ? JSON.parse(fs.readFileSync(householdPath, 'utf8'))
  : { source: 'https://www.data.go.kr/data/15107625/fileData.do', dataset: '서울특별시 강서구 행정동별 1인가구 현황', asOf: null, scope: '서울특별시 강서구·행정동', rows: [] }
const nationalWasteDataset = fs.existsSync(nationalWastePath)
  ? JSON.parse(fs.readFileSync(nationalWastePath, 'utf8'))
  : { source: 'https://www.data.go.kr/data/3070174/fileData.do', provider: '한국환경공단 · 자원순환정보시스템', dataset: '전국 폐기물 발생 및 처리현황', year: null, scope: '전국·시도·연간', rows: [] }
const nationalWasteBySido = new Map(nationalWasteDataset.rows.map((item) => [item.sido, item]))
const nationalHouseholdByRegion = new Map(nationalHouseholdDataset.regions.map((item) => [item.region, item]))

const envPath = path.join(rootDir, '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '')
  }
}

const publicDataServiceKey = process.env.PUBLIC_DATA_SERVICE_KEY || ''
const universityEndpoint = 'https://api.data.go.kr/openapi/tn_pubr_public_univ_info_api'

function householdForRegion(region) {
  return nationalHouseholdByRegion.get(region.district)
    ?? nationalHouseholdByRegion.get(`${region.sido} ${region.district}`)
    ?? null
}

function enrichRegion(region) {
  const household = householdForRegion(region)
  const waste = nationalWasteBySido.get(region.sido)
  return {
    ...region,
    ...(household ? { singleHouseholds: household.singleHouseholds, youngSingleHouseholds: household.youngSingleHouseholds, householdYear: household.year } : {}),
    ...(waste ? { wasteSido: waste.total, wasteHouseholdSido: waste.household, wasteYear: nationalWasteDataset.year } : {}),
  }
}

function getRisk(region) {
  const convenience = region?.categories?.편의점?.amt ?? 0
  const fresh = (region?.categories?.슈퍼마켓?.amt ?? 0) + (region?.categories?.대형할인점?.amt ?? 0)
  return Math.round((convenience / Math.max(convenience + fresh, 1)) * 100)
}

function formatWon(value) {
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}억원`
  return `${Math.round(value / 10000).toLocaleString()}만원`
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  })
  response.end(JSON.stringify(payload))
}

function firstValue(record, keys) {
  for (const key of keys) {
    if (record?.[key] !== undefined && record[key] !== null && String(record[key]).trim() !== '') return record[key]
  }
  return null
}

function normalizeUniversity(record) {
  return {
    name: firstValue(record, ['학교명', '학교명칭', 'univNm', 'universityName', 'schlNm']),
    type: firstValue(record, ['학교종류', '학교구분', 'univType', 'univSeNm']),
    sido: firstValue(record, ['시도명', '시도', 'ctprvnNm', 'ctpvNm']),
    address: firstValue(record, ['도로명주소', '소재지도로명주소', '주소', 'rdnmadr', 'lctnRoadNmAddr']),
    latitude: Number(firstValue(record, ['위도', 'latitude', 'lat'])) || null,
    longitude: Number(firstValue(record, ['경도', 'longitude', 'lon', 'lng'])) || null,
  }
}

async function fetchUniversities(sido) {
  if (!publicDataServiceKey) throw new Error('public_data_service_key_missing')
  const params = new URLSearchParams({
    ServiceKey: publicDataServiceKey,
    pageNo: '1',
    numOfRows: '1000',
    type: 'json',
  })
  if (sido) params.set('CTPV_NM', sido)
  const result = await fetch(`${universityEndpoint}?${params}`)
  if (!result.ok) throw new Error(`university_api_http_${result.status}`)
  const body = await result.json()
  const payload = body?.response ?? body
  const rows = payload?.body?.items?.item ?? payload?.body?.items ?? payload?.items?.item ?? payload?.items ?? []
  const items = Array.isArray(rows) ? rows : [rows]
  return { items: items.map(normalizeUniversity).filter((item) => item.name), totalCount: Number(payload?.body?.totalCount ?? payload?.totalCount ?? items.length) }
}

function reportFor(region) {
  const risk = getRisk(region)
  const convenience = region.categories?.편의점?.amt ?? 0
  const fresh = (region.categories?.슈퍼마켓?.amt ?? 0) + (region.categories?.대형할인점?.amt ?? 0)
  const ratio = (convenience / Math.max(fresh, 1)).toFixed(1)
  const priority = risk >= 65 ? '1순위' : risk >= 50 ? '2순위' : '관찰'
  return {
    decision: `${region.sido} ${region.district} 지역을 ${priority} 정책 검토 대상으로 제안합니다.`,
    summary: `청년 소비 ${formatWon(region.totalAmt)} 중 편의점 소비 비중이 ${risk}%이고, 신선식품·대형 유통보다 ${ratio}배 높습니다. 생활권 내 식사 대체 소비와 폐기물 관리 수요가 함께 나타날 가능성이 있습니다.`,
    evidence: [
      `편의점 집중도 ${risk}% · 최근 6개월 BC카드 20대 소비`,
      `편의점 소비 ${formatWon(convenience)} · 신선 유통 ${formatWon(fresh)}`,
      region.singleHouseholds ? `1인가구 ${region.singleHouseholds.toLocaleString()}가구 · KOSIS ${region.householdYear}년 시군구 통계` : '시군구별 1인가구 원천과 매칭 대기',
      region.wasteHouseholdSido ? `${region.sido} 생활폐기물 ${region.wasteHouseholdSido.toLocaleString()}만톤/년 · 한국환경공단 ${region.wasteYear}년 시도 통계` : '시도별 생활폐기물 원문과 매칭 대기',
    ],
    actions: [
      '반경 500m 내 스마트 분리배출·회수 거점 후보를 현장 확인',
      '생활폐기물 발생량과 설치 가능 부지를 함께 검토',
      '1개 거점을 시범 운영하고 4주 단위로 이용량과 민원 변화를 재측정',
    ],
  }
}

export async function handleApiRequest(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`)
  if (request.method === 'OPTIONS') {
    response.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' })
    response.end()
    return
  }

  if (url.pathname === '/api/health') {
    sendJson(response, 200, { ok: true, service: 'infra-lens-api', generatedAt: summary.generatedAt })
    return
  }
  if (url.pathname === '/api/summary') {
    sendJson(response, 200, { ...summary, regions: summary.regions.map(enrichRegion), householdSource: nationalHouseholdDataset.source, householdYear: nationalHouseholdDataset.year })
    return
  }
  if (url.pathname === '/api/regions') {
    const sido = url.searchParams.get('sido')
    const regions = sido ? summary.regions.filter((region) => region.sido === sido) : summary.regions
    sendJson(response, 200, { regions: regions.map(enrichRegion), householdSource: nationalHouseholdDataset.source, householdYear: nationalHouseholdDataset.year })
    return
  }
  if (url.pathname === '/api/report') {
    const sido = url.searchParams.get('sido')
    const district = url.searchParams.get('district')
    const region = summary.regions.map(enrichRegion).find((item) => item.sido === sido && item.district === district)
    if (!region) {
      sendJson(response, 404, { error: 'region_not_found' })
      return
    }
    sendJson(response, 200, { report: reportFor(region), generatedAt: new Date().toISOString(), region: { sido, district, risk: getRisk(region) } })
    return
  }
  if (url.pathname === '/api/sources') {
    let universityStatus = publicDataServiceKey ? 'configured' : 'pending'
    let universityCount = null
    if (publicDataServiceKey) {
      try {
        const result = await fetchUniversities()
        universityStatus = result.items.length > 0 ? 'connected' : 'configured'
        universityCount = result.totalCount
      } catch {
        universityStatus = 'error'
      }
    }
    sendJson(response, 200, {
      sources: [
        { name: 'ABP_CONTEST_DATA', provider: 'BC카드 소비데이터', status: 'connected', scope: '20대·시군구·2026.01—06' },
        { name: '서울특별시 생활폐기물 발생량 및 처리현황', provider: '서울특별시 / 공공데이터포털', status: 'catalogued', url: 'https://www.data.go.kr/data/15047172/fileData.do', scope: '자치구별·연간·XLSX' },
        { name: '전국 폐기물 발생 및 처리현황', provider: nationalWasteDataset.provider, status: nationalWasteDataset.rows.length ? 'connected' : 'pending', count: nationalWasteDataset.rows.length, url: nationalWasteDataset.source, scope: nationalWasteDataset.rows.length ? `${nationalWasteDataset.year}년·${nationalWasteDataset.scope}·시도 요약 JSON 적재` : '전국 원문 적재 대기' },
        { name: '전국 시군구 성 및 연령별 1인가구', provider: '국가데이터처 KOSIS', status: nationalHouseholdDataset.regions.length ? 'connected' : 'pending', count: nationalHouseholdDataset.regions.length, url: nationalHouseholdDataset.source, scope: nationalHouseholdDataset.regions.length ? `${nationalHouseholdDataset.year}년·${nationalHouseholdDataset.scope}·CSV 적재` : '전국 원문 적재 대기' },
        { name: '서울특별시 강서구 행정동별 1인가구 현황', provider: '서울특별시 / 공공데이터포털', status: householdDataset.rows.length ? 'connected' : 'pending', count: householdDataset.rows.length, url: householdDataset.source, scope: householdDataset.rows.length ? `${householdDataset.asOf}·행정동·원문 XLSX 적재` : '원문 파일 적재 대기' },
        { name: '전국대학및전문대학정보표준데이터', provider: '교육부·공공데이터포털', status: universityStatus, count: universityCount, url: universityEndpoint, scope: universityCount ? `${universityCount.toLocaleString()}건·REST JSON·WGS84 여부 확인 필요` : 'REST JSON·서비스키 인증' },
        { name: '무인 회수기 좌표', provider: '지자체·공공데이터포털', status: 'pending', scope: '원본 API 선택 필요·WGS84' },
      ],
    })
    return
  }
  if (url.pathname === '/api/public-data/waste') {
    const sido = url.searchParams.get('sido')
    const rows = sido ? nationalWasteDataset.rows.filter((item) => item.sido === sido) : nationalWasteDataset.rows
    sendJson(response, 200, { source: nationalWasteDataset.source, provider: nationalWasteDataset.provider, dataset: nationalWasteDataset.dataset, year: nationalWasteDataset.year, scope: nationalWasteDataset.scope, unit: nationalWasteDataset.unit, rows, rawFile: '/data/national-waste-2024.pdf', available: rows.length > 0 })
    return
  }
  if (url.pathname === '/api/public-data/universities') {
    try {
      const result = await fetchUniversities(url.searchParams.get('sido'))
      sendJson(response, 200, { ...result, source: universityEndpoint })
    } catch (error) {
      sendJson(response, 502, { error: error.message || 'university_api_failed' })
    }
    return
  }
  if (url.pathname === '/api/public-data/households') {
    const sido = url.searchParams.get('sido')
    const district = url.searchParams.get('district')
    const nationalRows = nationalHouseholdDataset.regions.filter((item) => {
      const region = item.region || ''
      const districtMatch = !district || region === district || region.endsWith(` ${district}`) || region.includes(` ${district} `)
      const sidoMatch = !sido || region === sido || region.startsWith(`${sido} `) || (district && districtMatch)
      return sidoMatch && districtMatch
    })
    const matchesNational = nationalRows.length > 0
    const matchesScope = (!sido || sido === '서울특별시') && (!district || district === '강서구')
    sendJson(response, 200, {
      source: matchesNational ? nationalHouseholdDataset.source : householdDataset.source,
      dataset: matchesNational ? nationalHouseholdDataset.dataset : householdDataset.dataset,
      scope: matchesNational ? nationalHouseholdDataset.scope : householdDataset.scope,
      asOf: matchesNational ? nationalHouseholdDataset.year : householdDataset.asOf,
      rows: matchesNational ? nationalRows : (matchesScope ? householdDataset.rows : []),
      available: matchesNational || matchesScope,
    })
    return
  }
  sendJson(response, 404, { error: 'not_found' })
}
