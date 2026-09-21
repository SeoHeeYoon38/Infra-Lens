import { useEffect, useState } from 'react'

export default function useInfraData() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/data/infra-lens-summary.json')
      .then((response) => response.json())
      .then(setData)
      .catch(() => setData({ regions: [], sidos: [] }))
  }, [])

  return data
}
