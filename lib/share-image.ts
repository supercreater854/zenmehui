// Canvas 分享图 — 外网暗色极简风（Typefully / Poet.so 风格）
// 返回 data URL（PNG），800×1000，适合 Twitter / Reddit / Instagram

const W = 800
const H = 1000
const PAD = 56
const MAX_TEXT_W = W - PAD * 2
const FONT = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(" ")
  let line = ""
  let cy = y

  for (let i = 0; i < words.length; i++) {
    const test = line ? line + " " + words[i] : words[i]
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      ctx.fillText(line, x, cy)
      line = words[i]
      cy += lineHeight
    } else {
      line = test
    }
  }
  if (line) {
    ctx.fillText(line, x, cy)
    cy += lineHeight
  }
  return cy
}

function truncateText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  ellipsis = "...",
): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let result = ""
  for (const ch of text) {
    if (ctx.measureText(result + ch + ellipsis).width > maxWidth) {
      return result + ellipsis
    }
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

  // ====== 背景：暗色渐变 ======
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, "#0f172a")   // slate-900
  bg.addColorStop(0.5, "#1e1b4b") // indigo-950
  bg.addColorStop(1, "#0f172a")
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // 微弱噪点质感（小圆点散布）
  ctx.fillStyle = "rgba(255,255,255,0.015)"
  for (let i = 0; i < 80; i++) {
    const rx = Math.random() * W
    const ry = Math.random() * H
    ctx.beginPath()
    ctx.arc(rx, ry, Math.random() * 2 + 0.5, 0, Math.PI * 2)
    ctx.fill()
  }

  // ====== 顶部品牌色细条 ======
  const topGrad = ctx.createLinearGradient(0, 0, W, 0)
  topGrad.addColorStop(0, "#10b981")
  topGrad.addColorStop(0.5, "#34d399")
  topGrad.addColorStop(1, "#10b981")
  ctx.fillStyle = topGrad
  ctx.fillRect(0, 0, W, 3)

  // ====== "They said:" 标签 ======
  const labelY = 130
  ctx.fillStyle = "rgba(148, 163, 184, 0.6)" // slate-400 at 60%
  ctx.font = `600 15px ${FONT}`
  ctx.textAlign = "center"
  ctx.fillText("They said:", W / 2, labelY)

  // ====== 对方原话（中号，浅灰） ======
  const msgY = 185
  ctx.fillStyle = "rgba(203, 213, 225, 0.85)" // slate-300
  ctx.font = `400 22px ${FONT}`

  const truncatedMsg = truncateText(ctx, message, MAX_TEXT_W - 20)
  ctx.textAlign = "center"
  ctx.fillText(`"${truncatedMsg}"`, W / 2, msgY)
  ctx.textAlign = "left"

  // ====== 分割线：emerald 渐变 ======
  const divY = 250
  const divGrad = ctx.createLinearGradient(PAD + 40, divY, W - PAD - 40, divY)
  divGrad.addColorStop(0, "rgba(16, 185, 129, 0.05)")
  divGrad.addColorStop(0.3, "rgba(16, 185, 129, 0.25)")
  divGrad.addColorStop(0.5, "rgba(52, 211, 153, 0.45)")
  divGrad.addColorStop(0.7, "rgba(16, 185, 129, 0.25)")
  divGrad.addColorStop(1, "rgba(16, 185, 129, 0.05)")
  ctx.strokeStyle = divGrad
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(PAD + 40, divY)
  ctx.lineTo(W - PAD - 40, divY)
  ctx.stroke()

  // 分割线上的小菱形装饰
  ctx.fillStyle = "rgba(52, 211, 153, 0.5)"
  ctx.save()
  ctx.translate(W / 2, divY)
  ctx.rotate(Math.PI / 4)
  ctx.fillRect(-4, -4, 8, 8)
  ctx.restore()

  // ====== AI 回复（大号白色加粗，主角） ======
  const replyStartY = 330
  ctx.fillStyle = "#f1f5f9" // slate-100
  ctx.font = `700 42px ${FONT}`
  ctx.textAlign = "center"

  // 如果回复很短（< 30 字符），用更大字号单行居中
  if (reply.length <= 30 && !reply.includes("\n")) {
    ctx.font = `700 52px ${FONT}`
    ctx.fillText(reply, W / 2, replyStartY + 60)
  } else {
    wrapText(ctx, reply, W / 2, replyStartY, MAX_TEXT_W, 56)
  }
  ctx.textAlign = "left"

  // ====== 底部品牌 ======
  const footerY = H - 120
  ctx.fillStyle = "rgba(16, 185, 129, 0.5)" // emerald-500
  ctx.font = `700 20px ${FONT}`
  ctx.textAlign = "center"
  ctx.fillText("ReplyCraft", W / 2, footerY)

  ctx.fillStyle = "rgba(148, 163, 184, 0.4)" // slate-400
  ctx.font = `400 13px ${FONT}`
  ctx.fillText("AI that gets the tone right.", W / 2, footerY + 30)

  // 底部微弱的品牌色线
  ctx.strokeStyle = "rgba(16, 185, 129, 0.08)"
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(PAD + 80, footerY - 30)
  ctx.lineTo(W - PAD - 80, footerY - 30)
  ctx.stroke()

  // ====== 右下角装饰圆 ======
  ctx.fillStyle = "rgba(16, 185, 129, 0.08)"
  ctx.beginPath()
  ctx.arc(W - 50, H - 50, 40, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = "rgba(16, 185, 129, 0.04)"
  ctx.beginPath()
  ctx.arc(W - 50, H - 50, 60, 0, Math.PI * 2)
  ctx.fill()

  ctx.textAlign = "left"
  return canvas.toDataURL("image/png")
}