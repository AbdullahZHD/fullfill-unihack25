"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"

interface CountdownTimerProps {
  targetDate: string
  targetTime: string
}

export function CountdownTimer({ targetDate, targetTime }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
    isPast: boolean
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
  })

  useEffect(() => {
    // Parse the target date and time
    const getTargetDateTime = () => {
      // If no specific time is provided, default to end of day
      const defaultTime = "23:59"
      const timeString = targetTime || defaultTime

      // Create date object from the date string
      const [year, month, day] = targetDate.split("-").map(Number)
      const [hours, minutes] = timeString.split(":").map(Number)

      return new Date(year, month - 1, day, hours, minutes)
    }

    const targetDateTime = getTargetDateTime()

    const calculateTimeRemaining = () => {
      const now = new Date()
      const difference = targetDateTime.getTime() - now.getTime()
      const isPast = difference <= 0

      // If the date is in the past, show zeros
      if (isPast) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isPast: true,
        })
        return
      }

      // Calculate time units
      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeRemaining({ days, hours, minutes, seconds, isPast })
    }

    // Calculate immediately and then set up interval
    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [targetDate, targetTime])

  // Format the display
  const formatTimeUnit = (value: number, unit: string) => {
    if (value === 0) return null
    return (
      <span>
        {value} {value === 1 ? unit : `${unit}s`}
      </span>
    )
  }

  if (timeRemaining.isPast) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Pickup time passed
      </Badge>
    )
  }

  // Show only the two largest non-zero units
  const timeUnits = [
    { value: timeRemaining.days, unit: "day" },
    { value: timeRemaining.hours, unit: "hour" },
    { value: timeRemaining.minutes, unit: "minute" },
    { value: timeRemaining.seconds, unit: "second" },
  ]

  const nonZeroUnits = timeUnits.filter(({ value }) => value > 0)
  const displayUnits = nonZeroUnits.slice(0, 2)

  const urgencyClass =
    timeRemaining.days === 0 && timeRemaining.hours < 3
      ? "bg-amber-500 hover:bg-amber-600"
      : "bg-green-500 hover:bg-green-600"

  return (
    <Badge className={`flex items-center gap-1 ${urgencyClass}`}>
      <Clock className="h-3 w-3" />
      {displayUnits.length > 0 ? (
        <span>
          {displayUnits.map(({ value, unit }, index) => (
            <span key={unit}>
              {formatTimeUnit(value, unit)}
              {index < displayUnits.length - 1 && ", "}
            </span>
          ))}
        </span>
      ) : (
        <span>Just now!</span>
      )}
    </Badge>
  )
}

