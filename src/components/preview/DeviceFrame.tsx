"use client"

import { motion } from "framer-motion"
import type { Breakpoint } from "@/types/tokens"

interface DeviceFrameProps {
  breakpoint: Breakpoint
  panelWidth: number
  children: React.ReactNode
}

const DEVICE_DIMS: Record<Breakpoint, { w: number; h: number }> = {
  desktop: { w: 1280, h: 800  },
  tablet:  { w: 768,  h: 1024 },
  mobile:  { w: 390,  h: 844  },
}

// Padding inside the frame chrome (px)
const CHROME_PAD: Record<Breakpoint, { x: number; y: number }> = {
  desktop: { x: 0,  y: 0  },
  tablet:  { x: 12, y: 16 },
  mobile:  { x: 8,  y: 48 },
}

export function DeviceFrame({ breakpoint, panelWidth, children }: DeviceFrameProps) {
  if (breakpoint === "desktop") {
    return (
      <motion.div
        layout
        className="w-full h-full overflow-auto"
      >
        {children}
      </motion.div>
    )
  }

  const dims   = DEVICE_DIMS[breakpoint]
  const chrome = CHROME_PAD[breakpoint]
  const available = panelWidth - 32          // 16px padding each side
  const scale  = available / dims.w
  const frameH = dims.h * scale

  return (
    <div className="flex justify-center w-full px-4 pt-4 pb-2">
      <motion.div
        layout
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1,    opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="relative flex-shrink-0"
        style={{ width: available, height: frameH + 8 }}
      >
        {/* Device outer chrome */}
        <div
          className="absolute inset-0 rounded-[24px] border-2"
          style={{
            borderColor: "var(--border)",
            background:  "var(--surface-2)",
            boxShadow:   "0 20px 60px rgb(0 0 0 / 0.4), inset 0 1px 0 rgb(255 255 255 / 0.06)",
          }}
        />

        {/* Mobile: top notch + home indicator */}
        {breakpoint === "mobile" && (
          <>
            {/* Notch */}
            <div
              className="absolute left-1/2 -translate-x-1/2 rounded-b-full z-10"
              style={{
                top: 2,
                width: available * 0.28,
                height: 10 * scale * 2.5,
                background: "var(--surface-2)",
                borderBottom: "2px solid var(--border)",
              }}
            />
            {/* Home indicator */}
            <div
              className="absolute left-1/2 -translate-x-1/2 rounded-full z-10"
              style={{
                bottom: 6 * scale,
                width: available * 0.3,
                height: 3 * scale + 1,
                background: "var(--muted)",
                opacity: 0.4,
              }}
            />
            {/* Status bar time */}
            <div
              className="absolute z-10 flex items-center justify-between font-semibold"
              style={{
                top: (CHROME_PAD.mobile.y * scale) / 3,
                left: available * 0.06,
                right: available * 0.06,
                fontSize: 7 * scale + 4,
                color: "var(--muted)",
                opacity: 0.6,
              }}
            >
              <span>9:41</span>
              <span>●●●</span>
            </div>
          </>
        )}

        {/* Tablet: camera dot */}
        {breakpoint === "tablet" && (
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-full z-10"
            style={{
              top: 6 * scale,
              width: 4 * scale + 2,
              height: 4 * scale + 2,
              background: "var(--muted)",
              opacity: 0.4,
            }}
          />
        )}

        {/* Scaled screen content */}
        <div
          className="absolute overflow-hidden"
          style={{
            top:    chrome.y * scale,
            left:   chrome.x * scale,
            right:  chrome.x * scale,
            bottom: breakpoint === "mobile" ? 20 * scale : chrome.y * scale,
            borderRadius: breakpoint === "mobile" ? 6 * scale : 4 * scale,
            background: "var(--background)",
          }}
        >
          <div
            style={{
              width:           dims.w,
              height:          dims.h,
              transform:       `scale(${scale})`,
              transformOrigin: "top left",
              overflow:        "hidden",
            }}
          >
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
