import { useEffect, useMemo, useRef, useState } from 'react'
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
  stable: { fill: '#74b8aa', stroke: '#226f67' },
  watch: { fill: '#e5b452', stroke: '#97691e' },
  critical: { fill: '#df7467', stroke: '#a83e35' },
}

let kakaoSdkPromise

function loadKakaoSdk() {
  if (window.kakao?.maps?.Map) return Promise.resolve(window.kakao.maps)
  if (kakaoSdkPromise) return kakaoSdkPromise

  const appKey = import.meta.env.VITE_KAKAO_MAP_APP_KEY
  if (!appKey) return Promise.reject(new Error('Kakao Maps JavaScript key is missing.'))

  kakaoSdkPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-infra-kakao-map]')
    const finish = () => window.kakao.maps.load(() => resolve(window.kakao.maps))

    if (existing) {
      if (window.kakao?.maps) finish()
      else existing.addEventListener('load', finish, { once: true })
      return
    }

    const script = document.createElement('script')
    script.dataset.infraKakaoMap = 'true'
    script.async = true
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`
    script.addEventListener('load', finish, { once: true })
    script.addEventListener('error', () => reject(new Error('Kakao Maps SDK could not be loaded.')), { once: true })
    document.head.appendChild(script)
  })

  return kakaoSdkPromise
}

function normalizeSido(name) {
  if (name === '강원도') return '강원특별자치도'
  if (name === '전라북도') return '전북특별자치도'
  return name
}

function shortSido(name) {
  return name.replace('특별자치도', '').replace('특별자치시', '').replace('특별시', '').replace('광역시', '')
}

function compactSido(name) {
  const compact = {
    경상남도: '경남',
    경상북도: '경북',
    전라남도: '전남',
    전북특별자치도: '전북',
    충청남도: '충남',
    충청북도: '충북',
    강원특별자치도: '강원',
  }
  return compact[name] ?? shortSido(name)
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

function collectOuterRings(geometry) {
  return geometryParts(geometry).map((polygon) => polygon[0]).filter(Boolean)
}

function getCenter(rings) {
  let minLng = Infinity
  let maxLng = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity

  rings.flat().forEach(([lng, lat]) => {
    minLng = Math.min(minLng, lng)
    maxLng = Math.max(maxLng, lng)
    minLat = Math.min(minLat, lat)
    maxLat = Math.max(maxLat, lat)
  })

  return [(minLat + maxLat) / 2, (minLng + maxLng) / 2]
}

function labelMarkup(name, risk, selected, showRisk, level) {
  return `<div class="kakao-region-label ${selected ? 'selected' : ''} ${level === 'sido' ? 'national' : 'district'}"><span>${name}</span>${showRisk ? `<b>${risk}</b>` : ''}</div>`
}

export default function KakaoPolicyMap({ data, mapLevel, selectedSido, selectedDistrict, onSelectSido, onSelectDistrict }) {
  const mapNodeRef = useRef(null)
  const mapRef = useRef(null)
  const objectsRef = useRef([])
  const [maps, setMaps] = useState(null)
  const [boundaries, setBoundaries] = useState(null)
  const [status, setStatus] = useState('loading')

  const sidoStats = useMemo(() => data.sidos.map((item) => {
    const regions = data.regions.filter((region) => region.sido === item.name)
    const risk = Math.round(regions.reduce((sum, region) => sum + getRisk(region), 0) / Math.max(regions.length, 1))
    return { ...item, risk, regions }
  }), [data])

  const sidoByName = useMemo(() => new Map(sidoStats.map((item) => [item.name, item])), [sidoStats])
  const districtByName = useMemo(() => new Map(
    data.regions.filter((region) => region.sido === selectedSido).map((region) => [canonicalName(region.district), region]),
  ), [data, selectedSido])

  useEffect(() => {
    let active = true
    loadKakaoSdk().then((loadedMaps) => {
      if (!active) return
      setMaps(loadedMaps)
    }).catch(() => {
      if (active) setStatus('error')
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    Promise.all([fetch(PROVINCES_URL).then((response) => response.json()), fetch(MUNICIPALITIES_URL).then((response) => response.json())])
      .then(([provinces, municipalities]) => {
        if (!active) return
        setBoundaries({ provinces, municipalities })
      })
      .catch(() => { if (active) setStatus('error') })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!maps || !boundaries || !mapNodeRef.current) return undefined

    if (!mapRef.current) {
      mapRef.current = new maps.Map(mapNodeRef.current, {
        center: new maps.LatLng(36.35, 127.85),
        level: 13,
      })
      mapRef.current.addControl(new maps.ZoomControl(), maps.ControlPosition.RIGHT)
    }

    const map = mapRef.current
    objectsRef.current.forEach((object) => object.setMap(null))
    objectsRef.current = []

    const selectedCode = sidoCodes[selectedSido]
    const features = mapLevel === 'sido'
      ? boundaries.provinces.features
      : boundaries.municipalities.features.filter((feature) => String(feature.properties.code).startsWith(selectedCode))
    const bounds = new maps.LatLngBounds()

    const featureMeta = features.map((feature) => {
      const featureName = feature.properties.name
      const region = mapLevel === 'sido'
        ? sidoByName.get(normalizeSido(featureName))
        : districtByName.get(canonicalName(featureName))
      const province = sidoByName.get(selectedSido)
      const risk = mapLevel === 'sido'
        ? region?.risk ?? 50
        : region ? getRisk(region) : province?.risk ?? 50
      const selected = mapLevel === 'sido'
        ? normalizeSido(featureName) === selectedSido
        : canonicalName(featureName) === canonicalName(selectedDistrict)
      return { feature, featureName, risk, selected }
    })

    const pinnedDistricts = new Set(featureMeta
      .filter((item) => item.risk >= 70)
      .sort((a, b) => b.risk - a.risk)
      .slice(0, 5)
      .map((item) => canonicalName(item.featureName)))
    pinnedDistricts.add(canonicalName(selectedDistrict))

    featureMeta.forEach(({ feature, featureName, risk, selected }) => {
      const rings = collectOuterRings(feature.geometry)
      const tone = colors[riskTone(risk)]
      const offset = mapLevel === 'sido' ? { lat: -.018, lng: .014 } : { lat: -.0025, lng: .002 }
      const interactiveObjects = []

      rings.forEach((ring) => {
        const path = ring.map(([lng, lat]) => {
          const point = new maps.LatLng(lat, lng)
          bounds.extend(point)
          return point
        })
        const depthPath = ring.map(([lng, lat]) => new maps.LatLng(lat + offset.lat, lng + offset.lng))
        const depth = new maps.Polygon({
          map,
          path: depthPath,
          strokeWeight: 0,
          fillColor: '#294b50',
          fillOpacity: selected ? .34 : .14,
          zIndex: selected ? 2 : 0,
        })
        const polygon = new maps.Polygon({
          map,
          path,
          strokeWeight: selected ? 4 : 2,
          strokeColor: selected ? '#0f6e67' : '#ffffff',
          strokeOpacity: 1,
          fillColor: tone.fill,
          fillOpacity: selected ? .9 : .72,
          zIndex: selected ? 5 : 3,
        })
        interactiveObjects.push(polygon)
        objectsRef.current.push(depth, polygon)
      })

      const [lat, lng] = getCenter(rings)
      const center = new maps.LatLng(lat, lng)
      const displayName = mapLevel === 'sido' ? compactSido(normalizeSido(featureName)) : featureName.replaceAll(' ', '')
      const persistent = mapLevel === 'sido' || pinnedDistricts.has(canonicalName(featureName))
      const overlay = new maps.CustomOverlay({
        position: center,
        content: labelMarkup(displayName, risk, selected, mapLevel === 'sido' || selected, mapLevel),
        yAnchor: selected ? 1.05 : .5,
        zIndex: selected ? 12 : 8,
      })
      if (persistent) overlay.setMap(map)
      objectsRef.current.push(overlay)

      interactiveObjects.forEach((polygon) => {
        maps.event.addListener(polygon, 'mouseover', () => {
          polygon.setOptions({ strokeWeight: 4, strokeColor: tone.stroke, fillOpacity: .92 })
          if (!persistent) overlay.setMap(map)
        })
        maps.event.addListener(polygon, 'mouseout', () => {
          polygon.setOptions({ strokeWeight: selected ? 4 : 2, strokeColor: selected ? '#0f6e67' : '#ffffff', fillOpacity: selected ? .9 : .72 })
          if (!persistent) overlay.setMap(null)
        })
        maps.event.addListener(polygon, 'click', () => {
          if (mapLevel === 'sido') onSelectSido(normalizeSido(featureName))
          else onSelectDistrict(districtByName.get(canonicalName(featureName))?.district ?? featureName)
        })
      })
    })

    map.setBounds(bounds, 36, 36, 36, 36)
    maps.event.trigger(map, 'resize')
    setStatus('ready')

    return () => {
      objectsRef.current.forEach((object) => object.setMap(null))
      objectsRef.current = []
    }
  }, [boundaries, data, districtByName, mapLevel, maps, onSelectDistrict, onSelectSido, selectedDistrict, selectedSido, sidoByName])

  return <div className="kakao-map-stage"><div ref={mapNodeRef} className="kakao-policy-map" aria-label={mapLevel === 'sido' ? '카카오 전국 정책 지도' : `${selectedSido} 시군구 정책 지도`} />{status === 'loading' && <div className="map-loading"><span className="loading-orb" /><strong>실제 행정경계 지도를 불러오는 중</strong></div>}{status === 'error' && <div className="map-error"><strong>카카오맵을 불러오지 못했습니다.</strong><span>도메인 또는 네트워크 설정을 확인해 주세요.</span></div>}<div className="map-depth-note"><i /> 클릭한 지역은 입체 음영으로 강조됩니다.</div></div>
}
