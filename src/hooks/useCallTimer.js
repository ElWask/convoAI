import { useEffect, useState } from 'react'

export const useCallTimer = (callStarted, callStartTime) => {
  const [elapsedTime, setElapsedTime] = useState("00:00")

  useEffect(() => {
    if (callStarted && callStartTime) {
      const interval = setInterval(() => {
        const diff = Math.floor((Date.now() - callStartTime) / 1000)
        const minutes = String(Math.floor(diff / 60)).padStart(2, "0")
        const seconds = String(diff % 60).padStart(2, "0")
        setElapsedTime(`${minutes}:${seconds}`)
      }, 1000)
      return () => clearInterval(interval)
    } else {
      setElapsedTime("00:00")
    }
  }, [callStarted, callStartTime])

  return elapsedTime
}
