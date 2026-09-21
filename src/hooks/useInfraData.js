import { useEffect, useState } from 'react'

export default function useInfraData() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/api/summary')
      .then((response) => {
        if (!response.ok) throw new Error(`summary_${response.status}`)
        return response.json()
      })
      .then(setData)
      .catch(() => setData({ regions: [], sidos: [] }))
  }, [])

  return data
}
