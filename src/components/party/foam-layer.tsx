"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"
import { createFoam, type FoamHandle } from "@/lib/foam"

/**
 * Full-viewport soap-suds layer. Mount it once; drive it imperatively:
 *   foamRef.current?.fill()   // suds rise to cover the screen
 *   foamRef.current?.blast()  // the success message blows them off
 *   foamRef.current?.reset()  // clear immediately (e.g. on error)
 *
 * The canvas sits above the page but below the error toast. It is
 * pointer-events:none so it never blocks the form underneath.
 */
export const FoamLayer = forwardRef<FoamHandle>(function FoamLayer(_props, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const handleRef = useRef<FoamHandle | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const foam = createFoam(canvasRef.current)
    handleRef.current = foam
    return () => {
      foam.destroy()
      handleRef.current = null
    }
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      fill: () => handleRef.current?.fill(),
      blast: () => handleRef.current?.blast(),
      reset: () => handleRef.current?.reset(),
      destroy: () => handleRef.current?.destroy(),
    }),
    [],
  )

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 105,
        pointerEvents: "none",
      }}
    />
  )
})
