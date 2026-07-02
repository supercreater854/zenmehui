// Canvas 绘制分享图：抖音风金句卡片 v2
// 返回 data URL（PNG）
// 改进：问题字更大、留白更少、视觉更紧凑

const W = 600
const H = 720
const PAD = 44
const MAX_TEXT_W = W - PAD * 2

function drawWrapped(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  ctx.save()
  const chars = [...text]
  let line = ""
  let cy = y

  for (let i = 0; i < chars.length; i++) {
    const test = line + chars[i]
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      ctx.fillText(line, x, cy)
      line = chars[i]
      cy += lineHeight
    } else {
      line = test
    }
  }
  if (line) {
    ctx.fillText(line, x, cy)
    cy += lineHeight
  }
  ctx.restore()
  return cy
}

const REPLY_FONT = "bold 32px -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif"

export function drawShareImage(message: string, reply: string): string {
  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")!
  if (!ctx) return ""

  // === 背景 ===
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, W, H)

  // 底部渐变色块
  const grad = ctx.createLinearGradient(0, H * 0.55, 0, H)
  grad.addColorStop(0, "rgba(16, 185, 129, 0.04)")
  grad.addColorStop(1, "rgba(16, 185, 129, 0.15)")
  ctx.fillStyle = grad
  ctx.fillRect(0, H * 0.55, W, H * 0.45)

  // 顶部品牌色条
  const topGrad = ctx.createLinearGradient(0, 0, W, 0)
  topGrad.addColorStop(0, "#10b981")
  topGrad.addColorStop(1, "#14b8a6")
  ctx.fillStyle = topGrad
  ctx.fillRect(0, 0, W, 5)

  // === 装饰大引号 ===
  ctx.fillStyle = "rgba(16, 185, 129, 0.12)"
  ctx.font = "100px Georgia, serif"
  ctx.fillText("\u201C", PAD - 5, 120)

  // === 对方原话（16px，灰色居中） ===
  const msgY = 95
  ctx.fillStyle = "#6b7280"
  ctx.font = "16px -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif"

  const prefix = "「"
  const suffix = "」"
  let displayMsg = message
  const maxMsgW = MAX_TEXT_W - 20
  if (ctx.measureText(prefix + displayMsg + suffix).width > maxMsgW) {
    const chars = [...displayMsg]
    let partial = ""
    for (const c of chars) {
      if (ctx.measureText(prefix + partial + c + "..." + suffix).width > maxMsgW) {
        partial += "..."
        break
      }
      partial += c
    }
    displayMsg = partial
  }

  ctx.textAlign = "center"
  ctx.fillText(prefix + displayMsg + suffix, W / 2, msgY)
  ctx.textAlign = "left"

  // === 分割线 ===
  const lineY = 125
  ctx.strokeStyle = "rgba(16, 185, 129, 0.18)"
  ctx.lineWidth = 1
  ctx.setLineDash([6, 4])
  ctx.beginPath()
  ctx.moveTo(PAD + 20, lineY)
  ctx.lineTo(W - PAD - 20, lineY)
  ctx.stroke()
  ctx.setLineDash([])

  // === AI 回复（32px 加粗，主视觉） ===
  const replyStartY = 175
  ctx.fillStyle = "#111827"
  ctx.font = REPLY_FONT
  const endY = drawWrapped(ctx, reply, PAD, replyStartY, MAX_TEXT_W, 46)

  // === 底部品牌 ===
  const footerY = H - 70
  ctx.strokeStyle = "rgba(16, 185, 129, 0.12)"
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(PAD + 20, footerY - 8)
  ctx.lineTo(W - PAD - 20, footerY - 8)
  ctx.stroke()

  ctx.fillStyle = "#10b981"
  ctx.font = "bold 18px -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif"
  ctx.textAlign = "center"
  ctx.fillText("怎么回", W / 2, footerY + 20)

  ctx.fillStyle = "#9ca3af"
  ctx.font = "12px -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif"
  ctx.fillText("AI 替你回 · 说话高情商", W / 2, footerY + 42)

  // 右下装饰
  ctx.fillStyle = "rgba(16, 185, 129, 0.15)"
  ctx.beginPath()
  ctx.arc(W - 40, H - 40, 28, 0, Math.PI * 2)
  ctx.fill()

  ctx.textAlign = "left"
  return canvas.toDataURL("image/png")
}