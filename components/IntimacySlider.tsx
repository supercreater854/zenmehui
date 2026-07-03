"use client"

import { useState, useRef, useCallback } from "react"
import { getIntimacyLabel } from "@/lib/intimacy"
import { COMPONENTS } from "@/lib/i18n"
import { t } from "@/lib/t"

interface IntimacySliderProps {
  value: number
  onChange: (value: number) => void
}

export default function IntimacySlider({ value, onChange }: IntimacySliderProps) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState("")
  const longPressRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const isLongPressing = useRef(false)

  const label = getIntimacyLabel(value)

  // 滑条渐变色：冷蓝(0) → 中性灰(50) → 暖橙(100)
  const barStyle = {
    background: `linear-gradient(to right, #93c5fd 0%, #d1d5db 50%, #fb923c 100%)`,
  }

  // 长按状态机
  const startLongPress = useCallback((delta: number) => {
    isLongPressing.current = true
    longPressRef.current = setInterval(() => {
      onChange(Math.max(0, Math.min(100, value + delta)))
    }, 80)
  }, [value, onChange])

  const stopLongPress = useCallback(() => {
    isLongPressing.current = false
    if (longPressRef.current) {
      clearInterval(longPressRef.current)
      longPressRef.current = null
    }
  }, [])

  const adjust = (delta: number) => {
    onChange(Math.max(0, Math.min(100, value + delta)))
  }

  const handlePressDown = useCallback((delta: number) => {
    longPressTimer.current = setTimeout(() => startLongPress(delta), 200)
  }, [startLongPress])

  const handlePressUp = useCallback((delta: number) => {
    clearTimeout(longPressTimer.current)
    if (isLongPressing.current) {
      stopLongPress()
    } else {
      adjust(delta)
    }
  }, [adjust, stopLongPress])

  const handlePressLeave = useCallback(() => {
    clearTimeout(longPressTimer.current)
    if (isLongPressing.current) {
      stopLongPress()
    }
  }, [stopLongPress])

  const handleSubmit = () => {
    const num = parseInt(editValue, 10)
    if (!isNaN(num) && num >= 0 && num <= 100) {
      onChange(num)
    }
    setEditing(false)
  }

  return (
    <div className="w-full">
      {/* 标签行 */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-gray-500">{t(COMPONENTS.intimacyLabel)}</span>

        <div className="flex items-center gap-1">
          {/* − 按钮（长按连续减） */}
          <button
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 text-base font-medium transition-all active:scale-90 select-none"
            onPointerDown={() => handlePressDown(-1)}
            onPointerUp={() => handlePressUp(-1)}
            onPointerLeave={handlePressLeave}
            disabled={value <= 0}
            title="−"
          >
            −
          </button>

          {/* 数字（点击可编辑） */}
          {editing ? (
            <input
              type="number"
              className="w-14 text-center text-sm font-medium text-gray-800 bg-gray-50 rounded-lg py-1 outline-none border border-gray-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSubmit}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
              autoFocus
              min={0}
              max={100}
            />
          ) : (
            <span
              className="text-sm font-medium text-gray-800 cursor-pointer hover:bg-gray-50 rounded-lg px-1.5 py-0.5 transition-colors min-w-[40px] text-center"
              onClick={() => { setEditing(true); setEditValue(String(value)) }}
              title="点击直接输入数字"
            >
              {label} · {value}
            </span>
          )}

          {/* + 按钮（长按连续加） */}
          <button
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 text-base font-medium transition-all active:scale-90 select-none"
            onPointerDown={() => handlePressDown(1)}
            onPointerUp={() => handlePressUp(1)}
            onPointerLeave={handlePressLeave}
            disabled={value >= 100}
            title="长按连续加"
          >
            +
          </button>
        </div>
      </div>

      {/* 滑条 */}
      <div className="relative">
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="
            w-full h-2 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-gray-300
            [&::-webkit-slider-thumb]:shadow-sm
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:active:scale-110
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-gray-300
            [&::-moz-range-thumb]:shadow-sm
            [&::-moz-range-thumb]:cursor-pointer
            [&::-moz-range-thumb]:border-none
          "
          style={barStyle}
        />
      </div>

      {/* 两端标签 */}
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-300">{t(COMPONENTS.stranger)}</span>
        <span className="text-xs text-gray-300">{t(COMPONENTS.family)}</span>
      </div>
    </div>
  )
}