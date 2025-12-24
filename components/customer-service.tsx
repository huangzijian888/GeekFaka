"use client"

import { useEffect } from "react"

export function CustomerService({ crispId }: { crispId?: string }) {
  useEffect(() => {
    if (!crispId) return

    // Define $crisp on window
    // @ts-ignore
    window.$crisp = [];
    // @ts-ignore
    window.CRISP_WEBSITE_ID = crispId;

    const script = document.createElement("script")
    script.src = "https://client.crisp.chat/l.js"
    script.async = true
    document.head.appendChild(script)

    return () => {
      // Optional: Cleanup if needed, though usually Crisp persists
      // document.head.removeChild(script)
    }
  }, [crispId])

  if (!crispId) return null

  return null
}
