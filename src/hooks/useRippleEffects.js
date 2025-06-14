import { useEffect, useState } from 'react'

export const useRippleEffects = (callStarted) => {
  const [ripples, setRipples] = useState([])

  useEffect(() => {
    if (!callStarted) return

    const interval = setInterval(() => {
      const id = Date.now()
      setRipples((prev) => [...prev, id])
      
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r !== id))
      }, 1500)
    }, 1000)

    return () => clearInterval(interval)
  }, [callStarted])

  return ripples
}
