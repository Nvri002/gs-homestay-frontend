// Pembuat gambar tiruan (SVG/PNG) dan pengecil foto unggahan Host.
const esc = (s) => String(s).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[c])

export function placeholderPhoto(title, subtitle = '', hue = 170) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 55% 38%)"/><stop offset="1" stop-color="hsl(${hue + 35} 60% 22%)"/></linearGradient></defs>` +
    `<rect width="800" height="450" fill="url(#g)"/>` +
    `<g fill="#fff" fill-opacity=".12"><circle cx="690" cy="90" r="130"/><rect x="60" y="250" width="380" height="220" rx="28"/></g>` +
    `<text x="48" y="350" font-family="Arial,sans-serif" font-size="44" font-weight="700" fill="#fff">${esc(title)}</text>` +
    `<text x="48" y="396" font-family="Arial,sans-serif" font-size="26" fill="#fff" fill-opacity=".85">${esc(subtitle)}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

// Gambar bukti transfer contoh (PNG) untuk data awal yang tidak punya berkas asli.
export function makeReceiptBlob({ code, amount, bank, accountNumber, accountName }) {
  return new Promise((resolve) => {
    const c = document.createElement('canvas')
    c.width = 640
    c.height = 840
    const g = c.getContext('2d')
    g.fillStyle = '#ffffff'
    g.fillRect(0, 0, 640, 840)
    g.fillStyle = '#0e7870'
    g.fillRect(0, 0, 640, 120)
    g.fillStyle = '#ffffff'
    g.font = 'bold 34px Arial'
    g.fillText('BUKTI TRANSFER', 40, 62)
    g.font = '20px Arial'
    g.fillText('Contoh — data tiruan mode demo', 40, 95)
    g.fillStyle = '#11201c'
    const rows = [
      ['Bank tujuan', bank],
      ['No. rekening', accountNumber],
      ['Atas nama', accountName],
      ['Kode booking', code],
      ['Nominal', `Rp${Number(amount).toLocaleString('id-ID')}`],
      ['Status', 'BERHASIL'],
    ]
    rows.forEach(([k, v], i) => {
      const y = 200 + i * 90
      g.fillStyle = '#6b7f79'
      g.font = '20px Arial'
      g.fillText(k, 40, y)
      g.fillStyle = '#11201c'
      g.font = 'bold 28px Arial'
      g.fillText(String(v), 40, y + 36)
    })
    c.toBlob((b) => resolve(b), 'image/png')
  })
}

// Foto unggahan Host disimpan sebagai thumbnail kecil (agar muat di localStorage).
export async function toThumb(file, max = 720) {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = url
    })
    const scale = Math.min(1, max / Math.max(img.width, img.height))
    const c = document.createElement('canvas')
    c.width = Math.round(img.width * scale)
    c.height = Math.round(img.height * scale)
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
    return c.toDataURL('image/jpeg', 0.72)
  } catch {
    return ''
  } finally {
    URL.revokeObjectURL(url)
  }
}
