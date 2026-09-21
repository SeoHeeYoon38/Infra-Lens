const iconPaths = {
  compass: 'M12 2.5 6.8 13.2 2.5 18.5 13.2 13.2 18.5 2.5 12 2.5Zm0 6.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z',
  map: 'M3 5.5 8.8 3l6.4 3L21 3.5v15L15.2 21l-6.4-3L3 20.5v-15Zm5.7-.2v11.5m6.6-10.1v11.5',
  layers: 'M12 3 3 7.5 12 12l9-4.5L12 3Zm-9 9 9 4.5 9-4.5M3 16.5 12 21l9-4.5',
  signal: 'M3 18v3m5-7v7m5-11v11m5-15v15m5-19v19',
  database: 'M5 5.5C5 4.1 8.1 3 12 3s7 1.1 7 2.5S15.9 8 12 8 5 6.9 5 5.5Zm0 0v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-6m-14 6v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-6',
  arrow: 'M5 12h13m-5-5 5 5-5 5',
  chevron: 'm7 10 5 5 5-5',
  download: 'M12 3v11m0 0 4-4m-4 4-4-4M5 21h14',
  refresh: 'M20 11a8 8 0 0 0-14.7-4L3 10m0 0V5m0 5h5m11 3a8 8 0 0 1-14.7 4L3 14m0 0v5m0-5h5',
  external: 'M14 4h6v6m-1-5-9 9M17 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5',
  recycle: 'm7 7 2-3 3 1m5 5 3 2-2 3m-5 5-1 3-3-1M9 4l3 5H7m9 1-3 5 5-1m-9 0 3-5-5 1',
}

export default function Icon({ name, size = 18, strokeWidth = 1.7 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={iconPaths[name]} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
