'use client'

import { useEffect, useState } from 'react'

function useCommandPalette() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    const onOpen = () => setOpen(true)

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('open-command-palette', onOpen)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('open-command-palette', onOpen)
    }
  }, [])

  return { open, setOpen }
}

export { useCommandPalette }
