import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const summaryPath = path.join(rootDir, 'public', 'data', 'infra-lens-summary.json')
const port = Number(process.env.INFRA_LENS_API_PORT || 8787)
const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'))

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

function reportFor(region) {
  const risk = getRisk(region)
  const convenience = region.categories?.편의점?.amt ?? 0
  const fresh = (region.categories?.슈퍼마켓?.amt ?? 0) + (region.categories?.대형할인점?.amt ?? 0)
  const ratio = (convenience / Math.max(fresh, 1)).toFixed(1)
  const priority = risk >= 65 ? '1순위' : risk >= 50 ? '2순위' : '관찰'
  return `${region.sido} ${region.district}은 편의점 집중도 ${risk}%로 ${priority} 검토 대상입니다. 최근 6개월 청년 소비 ${formatWon(region.totalAmt)} 중 편의점 소비가 신선식품·대형 유통보다 ${ratio}배 높아 생활권 자급력 취약 신호가 확인됩니다. 반경 500m 내 무인 회수기와 분리배출 거점을 우선 검토하고, 서울시 생활폐기물 발생량 통계와 연계해 다음 정책 집행 주기의 후보지로 제안합니다.`
}

const server = http.createServer((request, response) => {
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
    sendJson(response, 200, summary)
    return
  }
  if (url.pathname === '/api/regions') {
    const sido = url.searchParams.get('sido')
    sendJson(response, 200, { regions: sido ? summary.regions.filter((region) => region.sido === sido) : summary.regions })
    return
  }
  if (url.pathname === '/api/report') {
    const sido = url.searchParams.get('sido')
    const district = url.searchParams.get('district')
    const region = summary.regions.find((item) => item.sido === sido && item.district === district)
    if (!region) {
      sendJson(response, 404, { error: 'region_not_found' })
      return
    }
    sendJson(response, 200, { report: reportFor(region), generatedAt: new Date().toISOString(), region: { sido, district, risk: getRisk(region) } })
    return
  }
  if (url.pathname === '/api/sources') {
    sendJson(response, 200, {
      sources: [
        { name: 'ABP_CONTEST_DATA', provider: 'BC카드 소비데이터', status: 'connected', scope: '20대·시군구·2026.01—06' },
        { name: '서울특별시 생활폐기물 발생량 및 처리현황', provider: '서울특별시 / 공공데이터포털', status: 'catalogued', url: 'https://www.data.go.kr/data/15047172/fileData.do', scope: '자치구별·연간·XLSX' },
        { name: '주민등록 1인가구 통계', provider: '행정안전부 / 공공데이터포털', status: 'pending', scope: '서비스키 필요·행정동·월별' },
        { name: '대학교·무인 회수기 좌표', provider: '지자체·공공데이터포털', status: 'pending', scope: '원본 API 선택 필요·WGS84' },
      ],
    })
    return
  }
  sendJson(response, 404, { error: 'not_found' })
})

server.listen(port, () => {
  console.log(`Infra-Lens API listening on http://localhost:${port}`)
})
