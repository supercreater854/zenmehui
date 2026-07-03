// Canvas 分享图 — 外网暗色极简风（Typefully / Poet.so 风格）
// 返回 data URL（PNG），800×850，紧凑布局

const W = 800
const H = 850
const PAD = 52
const MAX_TEXT_W = W - PAD * 2
const FONT = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`

function wrapTextCentered(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(" ")
  let lines: string[] = []
  let line = ""

  for (const w of words) {
    const test = line ? line + " " + w : w
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      lines.push(line)
      line = w
    } else {
      line = test
    }
  }
  if (line) lines.push(line)

  let cy = y
  for (const l of lines) {
    ctx.fillText(l, cx, cy)
    cy += lineHeight
  }
  return cy
}

function truncateCentered(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let result = ""
  for (const ch of text) {
    if (ctx.measureText(result + ch + "...").width > maxWidth) return result + "..."
    result += ch
  }
  return result
}

export function drawShareImage(message: string, reply: string): string {
  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")!
  if (!ctx) return ""

  // ====== 暗色背景 ======
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, "#0f172a")
  bg.addColorStop(0.4, "#1e1b4b")
  bg.addColorStop(1, "#0f172a")
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // 顶部品牌色条
  const topGrad = ctx.createLinearGradient(0, 0, W, 0)
  topGrad.addColorStop(0, "#10b981")
  topGrad.addColorStop(0.5, "#34d399")
  topGrad.addColorStop(1, "#10b981")
  ctx.fillStyle = topGrad
  ctx.fillRect(0, 0, W, 3)

  ctx.textAlign = "center"

  // ====== "They said:" 标签 ======
  const labelY = 100
  ctx.fillStyle = "rgba(148, 163, 184, 0.55)"
  ctx.font = `600 14px ${FONT}`
  ctx.fillText("They said:", W / 2, labelY)

  // ====== 对方原话 — 28px，浅灰白 ======
  const msgY = 158
  ctx.fillStyle = "rgba(203, 213, 225, 0.9)"
  ctx.font = `400 28px ${FONT}`

  const truncatedMsg = truncateCentered(ctx, message, MAX_TEXT_W - 20)
  ctx.fillText(`"${truncatedMsg}"`, W / 2, msgY)

  // ====== 分割线 ======
  const divY = 220
  const divGrad = ctx.createLinearGradient(PAD, 0, W - PAD, 0)
  divGrad.addColorStop(0, "rgba(16, 185, 129, 0.05)")
  divGrad.addColorStop(0.3, "rgba(16, 185, 129, 0.3)")
  divGrad.addColorStop(0.5, "rgba(52, 211, 153, 0.55)")
  divGrad.addColorStop(0.7, "rgba(16, 185, 129, 0.3)")
  divGrad.addColorStop(1, "rgba(16, 185, 129, 0.05)")
  ctx.strokeStyle = divGrad
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(PAD + 30, divY)
  ctx.lineTo(W - PAD - 30, divY)
  ctx.stroke()

  // 菱形装饰
  ctx.fillStyle = "rgba(52, 211, 153, 0.55)"
  ctx.save()
  ctx.translate(W / 2, divY)
  ctx.rotate(Math.PI / 4)
  ctx.fillRect(-4, -4, 8, 8)
  ctx.restore()

  // ====== AI 回复 — 大号白字，主角 ======
  const replyStartY = 300
  ctx.fillStyle = "#f1f5f9"

  if (reply.length <= 25 && !reply.includes("\n")) {
    // 短回复：54px 大字居中
    ctx.font = `700 54px ${FONT}`
    ctx.fillText(reply, W / 2, replyStartY + 60)
  } else if (reply.length <= 60 && !reply.includes("\n")) {
    // 中等：46px
    ctx.font = `700 46px ${FONT}`
    ctx.fillText(reply, W / 2, replyStartY + 50)
  } else {
    // 长回复：36px 换行
    ctx.font = `700 36px ${FONT}`
    wrapTextCentered(ctx, reply, W / 2, replyStartY + 30, MAX_TEXT_W, 48)
  }

  // ====== 底部品牌 ======
  const footerY = H - 80
  ctx.strokeStyle = "rgba(16, 185, 129, 0.1)"
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(PAD + 60, footerY - 24)
  ctx.lineTo(W - PAD - 60, footerY - 24)
  ctx.stroke()

  ctx.fillStyle = "rgba(16, 185, 129, 0.55)"
  ctx.font = `700 18px ${FONT}`
  ctx.fillText("ReplyCraft", W / 2, footerY + 8)

  ctx.fillStyle = "rgba(148, 163, 184, 0.35)"
  ctx.font = `400 12px ${FONT}`
  ctx.fillText("AI that gets the tone right.", W / 2, footerY + 34)

  // 右下装饰
  ctx.fillStyle = "rgba(16, 185, 129, 0.06)"
  ctx.beginPath()
  ctx.arc(W - 40, H - 40, 32, 0, Math.PI * 2)
  ctx.fill()

  ctx.textAlign = "left"
  return canvas.toDataURL("image/png")
}