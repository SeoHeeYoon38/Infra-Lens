import { mkdir, writeFile } from 'node:fs/promises'

const baseUrl = 'https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2013/json'
const files = {
  'korea-provinces.geo.json': `${baseUrl}/skorea_provinces_geo_simple.json`,
  'korea-municipalities.geo.json': `${baseUrl}/skorea_municipalities_geo_simple.json`,
}

await mkdir(new URL('../public/data/', import.meta.url), { recursive: true })

for (const [fileName, url] of Object.entries(files)) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Boundary download failed: ${response.status} ${url}`)
  const body = await response.text()
  JSON.parse(body)
  await writeFile(new URL(`../public/data/${fileName}`, import.meta.url), body)
  console.log(`Saved ${fileName}`)
}
