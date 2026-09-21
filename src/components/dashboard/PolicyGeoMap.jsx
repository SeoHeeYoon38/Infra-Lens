import { useEffect, useMemo, useState } from 'react'
import { getRisk, riskTone } from '../../utils/risk'

const PROVINCES_URL = '/data/korea-provinces.geo.json'
const MUNICIPALITIES_URL = '/data/korea-municipalities.geo.json'

const sidoCodes = {
  서울특별시: '11', 부산광역시: '21', 대구광역시: '22', 인천광역시: '23',
  광주광역시: '24', 대전광역시: '25', 울산광역시: '26', 세종특별자치시: '29',
  경기도: '31', 강원특별자치도: '32', 충청북도: '33', 충청남도: '34',
  전북특별자치도: '35', 전라남도: '36', 경상북도: '37', 경상남도: '38', 제주특별자치도: '39',
}

const colors = {
  stable: { fill: '#8dbfb5', edge: '#286f68', depth: '#2d6b66' },
  watch: { fill: '#dfbd65', edge: '#9b711f', depth: '#8a6524' },
  critical: { fill: '#dc8178', edge: '#a44239', depth: '#8f3e3a' },
}

function normalizeSido(name) {
  if (name === '강원도') return '강원특별자치도'
  if (name === '전라북도') return '전북특별자치도'
  return name
}

function compactSido(name) {
  const compact = {
    경상남도: '경남', 경상북도: '경북', 전라남도: '전남', 전북특별자치도: '전북',
    충청남도: '충남', 충청북도: '충북', 강원특별자치도: '강원',
    세종특별자치시: '세종',
  }
  return compact[name] ?? name.replace('특별자치도', '').replace('특별시', '').replace('광역시', '')
}

function compactDistrict(name = '') {
  const cleaned = name.replaceAll(' ', '')
  const cityDistrict = cleaned.match(/^(.+시)(.+구)$/)
  if (cityDistrict) return `${cityDistrict[1]}·${cityDistrict[2]}`
  return cleaned
}

function canonicalName(name = '') {
  return name.replaceAll(' ', '')
}

function geometryParts(geometry) {
  if (!geometry) return []
  if (geometry.type === 'Polygon') return [geometry.coordinates]
  if (geometry.type === 'MultiPolygon') return geometry.coordinates
  return []
}

function ringsFor(feature, level = 'sido') {
  const rings = geometryParts(feature.geometry).map((polygon) => polygon[0]).filter(Boolean)
  if (rings.length <= 1) return rings
  const visibleCount = level === 'sido' ? 4 : 1
  return [...rings].sort((a, b) => b.length - a.length).slice(0, visibleCount)
}

function displayRing(ring, feature, level, selectedSido) {
  const featureName = feature.properties.name
  const ringCenter = ring.reduce((sum, [lng, lat]) => [sum[0] + lng, sum[1] + lat], [0, 0])
  const averageLng = ringCenter[0] / ring.length

  // National policy view should read like a compact administrative map. Keep
  // remote islands attached to their province instead of letting them shrink
  // the whole country into a tiny cluster.
  if (level === 'sido') {
    if (featureName === '제주특별자치도') {
      return ring.map(([lng, lat]) => [lng, lat + .62])
    }
    if (featureName === '경상북도' && averageLng > 130) {
      return ring.map(([lng, lat]) => [129.55 + (lng - 130.8) * .16, lat - .12])
    }
  }

  if (level !== 'district' || selectedSido !== '인천광역시') return ring
  if (featureName === '옹진군') {
    return ring.map(([lng, lat]) => [126.48 + (lng - 124.9) * .12, 37.38 + (lat - 37.1) * .2])
  }
  if (featureName === '강화군') {
    return ring.map(([lng, lat]) => [lng + .13, lat - .11])
  }
  return ring
}

function displayRings(feature, level, selectedSido) {
  return ringsFor(feature, level).map((ring) => displayRing(ring, feature, level, selectedSido))
}

function featureCoordinates(features, level, selectedSido) {
  return features.flatMap((feature) => displayRings(feature, level, selectedSido).flat())
}

function makeProjector(features, width, height, level, selectedSido) {
  const coordinates = featureCoordinates(features, level, selectedSido)
  const lngs = coordinates.map(([lng]) => lng)
  const lats = coordinates.map(([, lat]) => lat)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const lngSpan = Math.max(maxLng - minLng, .01)
  const latSpan = Math.max(maxLat - minLat, .01)
  const padding = Math.min(width, height) * .075
  const usableWidth = width - padding * 2
  const usableHeight = height - padding * 2
  const scale = Math.min(usableWidth / lngSpan, usableHeight / latSpan)
  const margin = 70

  return {
    point: ([lng, lat]) => [margin + (lng - minLng) * scale, margin + (maxLat - lat) * scale],
    bounds: { minLng, maxLng, minLat, maxLat },
    width: lngSpan * scale + margin * 2,
    height: latSpan * scale + margin * 2,
  }
}

function pathFor(feature, project, level, selectedSido) {
  return displayRings(feature, level, selectedSido).map((ring) => {
    const points = ring.map(project.point)
    return `${points.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ')} Z`
  }).join(' ')
}

function centerFor(feature, project, level, selectedSido) {
  const coordinates = featureCoordinates([feature], level, selectedSido)
  const [x, y] = coordinates.reduce((sum, coordinate) => {
    const [px, py] = project.point(coordinate)
    return [sum[0] + px, sum[1] + py]
  }, [0, 0])
  return [x / coordinates.length, y / coordinates.length]
}

function placeLabels(meta, level, width, height) {
  const nudges = level === 'sido' ? {
    인천광역시: [-26, 8],
    서울특별시: [28, 14],
    경기도: [16, -12],
    충청남도: [-22, 12],
    세종특별자치시: [22, -13],
    대전광역시: [18, 18],
    충청북도: [24, -12],
    광주광역시: [-16, -8],
    전라남도: [16, 8],
    부산광역시: [17, 12],
  } : {}

  return meta.map((item) => {
    const name = normalizeSido(item.featureName)
    const [dx, dy] = nudges[name] ?? [0, 0]
    return {
      ...item,
      labelX: Math.min(width - 36, Math.max(36, item.center[0] + dx)),
      labelY: Math.min(height - 34, Math.max(34, item.center[1] + dy)),
    }
  })
}

function loadBoundary(url) {
  return fetch(url).then((response) => {
    if (!response.ok) throw new Error(`Boundary request failed: ${response.status}`)
    return response.json()
  })
}

export default function PolicyGeoMap({ data, mapLevel, selectedSido, selectedDistrict, onSelectSido, onSelectDistrict }) {
  const [boundaries, setBoundaries] = useState(null)
  const [hovered, setHovered] = useState(null)

  useEffect(() => {
    Promise.all([loadBoundary(PROVINCES_URL), loadBoundary(MUNICIPALITIES_URL)])
      .then(([provinces, municipalities]) => setBoundaries({ provinces, municipalities }))
      .catch(() => setBoundaries({ provinces: { features: [] }, municipalities: { features: [] } }))
  }, [])

  const sidoStats = useMemo(() => data.sidos.map((item) => {
    const regions = data.regions.filter((region) => region.sido === item.name)
    const risk = Math.round(regions.reduce((sum, region) => sum + getRisk(region), 0) / Math.max(regions.length, 1))
    return { ...item, risk, regions }
  }), [data])

  const sidoByName = useMemo(() => new Map(sidoStats.map((item) => [item.name, item])), [sidoStats])
  const districtByName = useMemo(() => new Map(
    data.regions.filter((region) => region.sido === selectedSido).map((region) => [canonicalName(region.district), region]),
  ), [data, selectedSido])

  const view = useMemo(() => {
    if (!boundaries) return null
    const selectedCode = sidoCodes[selectedSido]
    const features = mapLevel === 'sido'
      ? boundaries.provinces.features
      : boundaries.municipalities.features.filter((feature) => String(feature.properties.code).startsWith(selectedCode))
    const project = makeProjector(features, 1200, 720, mapLevel, selectedSido)
    const width = project.width
    const height = project.height
    const meta = features.map((feature) => {
      const featureName = feature.properties.name
      const region = mapLevel === 'sido'
        ? sidoByName.get(normalizeSido(featureName))
        : districtByName.get(canonicalName(featureName))
      const province = sidoByName.get(selectedSido)
      const risk = mapLevel === 'sido' ? region?.risk ?? 50 : region ? getRisk(region) : province?.risk ?? 50
      const selected = mapLevel === 'sido'
        ? normalizeSido(featureName) === selectedSido
        : canonicalName(featureName) === canonicalName(selectedDistrict)
      return { feature, featureName, region, risk, selected, path: pathFor(feature, project, mapLevel, selectedSido), center: centerFor(feature, project, mapLevel, selectedSido) }
    })
    const pinned = new Set(meta.filter((item) => item.risk >= 70).sort((a, b) => b.risk - a.risk).slice(0, 5).map((item) => canonicalName(item.featureName)))
    pinned.add(canonicalName(selectedDistrict))
    return { width, height, meta, labels: placeLabels(meta, mapLevel, width, height), bounds: project.bounds, pinned }
  }, [boundaries, districtByName, mapLevel, selectedDistrict, selectedSido, sidoByName])

  if (!view) return <div className="policy-map-stage"><div className="policy-map-loading"><span className="loading-orb" /><strong>Infra-Lens 지도를 준비하는 중</strong></div></div>

  return <div className="policy-map-stage">
    <div className="policy-map-title">{mapLevel === 'sido' ? '대한민국 · 시도별 생활권 취약도' : `${compactSido(selectedSido)} · 시군구 생활권 취약도`}</div>
    <svg key={`${mapLevel}-${selectedSido}-${selectedDistrict}`} className="policy-geo-svg" viewBox={`0 0 ${view.width} ${view.height}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={mapLevel === 'sido' ? '전국 시도별 취약도 지도' : `${selectedSido} 시군구 취약도 지도`}>
      <defs>
        <filter id="region-shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="8" stdDeviation="5" floodColor="#214d50" floodOpacity=".28" /></filter>
      </defs>
      <g className="policy-geo-regions">
        {view.meta.map((item) => {
          const tone = colors[riskTone(item.risk)]
          return <g key={`${item.featureName}-${item.feature.properties.code}`} className={`policy-region ${riskTone(item.risk)} ${item.selected ? 'selected' : ''} ${hovered === item.featureName ? 'hovered' : ''}`} onMouseEnter={() => setHovered(item.featureName)} onMouseLeave={() => setHovered(null)} onClick={() => mapLevel === 'sido' ? onSelectSido(normalizeSido(item.featureName)) : onSelectDistrict(item.region?.district ?? item.featureName)}>
            <path className="policy-region-depth" d={item.path} transform="translate(0 8)" fill={tone.depth} />
            <path className="policy-region-shape" d={item.path} fill={tone.fill} stroke={tone.edge} />
            <path className="policy-region-hit" d={item.path} />
          </g>
        })}
      </g>
    </svg>
    <div className="policy-html-labels" aria-hidden="true">
      {view.labels.map((item) => {
        const name = mapLevel === 'sido' ? compactSido(normalizeSido(item.featureName)) : compactDistrict(item.featureName)
        const showLabel = mapLevel === 'sido' || view.pinned.has(canonicalName(item.featureName)) || hovered === item.featureName || mapLevel === 'district'
        if (!showLabel) return null
        return <span key={`label-${item.feature.properties.code}`} className={`policy-html-label ${mapLevel === 'district' ? 'district-label' : 'sido-label'} ${item.selected ? 'selected' : ''}`} style={{ left: `${(item.labelX / view.width) * 100}%`, top: `${(item.labelY / view.height) * 100}%` }}><span>{name}</span>{(mapLevel === 'sido' || item.selected) && <b>{item.risk}</b>}</span>
      })}
    </div>
    <div className="policy-map-hint"><span /> 지역을 클릭하면 필요한 범위만 크게 펼쳐집니다.</div>
  </div>
}
