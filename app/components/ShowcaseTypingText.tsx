'use client'

import React, { useEffect, useState } from 'react'

type Props = {
  text: string
  active?: boolean
  speed?: number
  delay?: number
  className?: string
  showCursor?: boolean
  onComplete?: () => void
}

export function ShowcaseTypingText(props: Props) {
  const {
    text,
    active = true,
    speed = 32,
    delay = 0,
    className,
    showCursor = true,
    onComplete,
  } = props
  const [display, setDisplay] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!active) {
      setDisplay('')
      setDone(false)
      return
    }

    setDisplay('')
    setDone(false)
    let index = 0
    let tickTimer = 0
    let startTimer = 0

    startTimer = window.setTimeout(() => {
      const tick = () => {
        index += 1
        setDisplay(text.slice(0, index))
        if (index < text.length) {
          tickTimer = window.setTimeout(tick, speed)
        } else {
          setDone(true)
          onComplete?.()
        }
      }
      tick()
    }, delay)

    return () => {
      window.clearTimeout(startTimer)
      window.clearTimeout(tickTimer)
    }
  }, [text, active, speed, delay, onComplete])

  return (
    <span className={className}>
      {display}
      {showCursor && active && !done ? (
        <span className="ns-showcase-cursor" aria-hidden>
          |
        </span>
      ) : null}
    </span>
  )
}
