#!/usr/bin/env node
// Hex → Pantone converter (Node CLI)
// FR : on calcule le match le plus proche en CIELAB (ΔE00)
// et on exporte en CSV/log l’historique. Base du Pantone chargée depuis pantone.json.

const fs = require('fs')
const path = require('path')

const DATA_PATH = path.join(__dirname, 'pantone.json')
const HISTORY_PATH = path.join(__dirname, 'history.log')

function parseArgs(argv) {
  const args = { hex: null, export: null, html: null }
  const rest = []
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--export' && argv[i + 1]) { args.export = argv[++i]; continue }
    if (a === '--html' && argv[i + 1]) { args.html = argv[++i]; continue }
    if (!args.hex && /^#?[0-9A-Fa-f]{6}$/.test(a)) { args.hex = a; continue }
    rest.push(a)
  }
  return args
}

function normalizeHex(hex) {
  if (!hex) return null
  const m = hex.trim().match(/^#?([0-9A-Fa-f]{6})$/)
  return m ? `#${m[1].toUpperCase()}` : null
}

// Hex → RGB [0..255]
function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16)
  }
}

// RGB → XYZ (D65)
function rgbToXyz({ r, g, b }) {
  // normalize
  r /= 255; g /= 255; b /= 255
  // gamma correction (sRGB)
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92
  // D65 conversion
  return {
    x: (r * 0.4124 + g * 0.3576 + b * 0.1805) * 100,
    y: (r * 0.2126 + g * 0.7152 + b * 0.0722) * 100,
    z: (r * 0.0193 + g * 0.1192 + b * 0.9505) * 100
  }
}

// XYZ → Lab (CIELAB, D65)
function xyzToLab({ x, y, z }) {
  const ref = { x: 95.047, y: 100.0, z: 108.883 }
  x /= ref.x; y /= ref.y; z /= ref.z
  const f = v => v > 0.008856 ? Math.pow(v, 1/3) : (7.787 * v) + (16/116)
  const fx = f(x), fy = f(y), fz = f(z)
  return {
    L: (116 * fy) - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz)
  }
}

// ΔE2000 (CMC-ish advanced metric for Lab)
function deltaE00(lab1, lab2) {
  const { L: L1, a: a1, b: b1 } = lab1
  const { L: L2, a: a2, b: b2 } = lab2
  const avgLp = (L1 + L2) / 2
  const C1 = Math.sqrt(a1 * a1 + b1 * b1)
  const C2 = Math.sqrt(a2 * a2 + b2 * b2)
  const avgC = (C1 + C2) / 2
  const G = 0.5 * (1 - Math.sqrt(Math.pow(avgC, 7) / (Math.pow(avgC, 7) + Math.pow(25, 7))))
  const a1p = (1 + G) * a1
  const a2p = (1 + G) * a2
  const C1p = Math.sqrt(a1p * a1p + b1 * b1)
  const C2p = Math.sqrt(a2p * a2p + b2 * b2)
  const avgCp = (C1p + C2p) / 2
  const h1p = Math.atan2(b1, a1p) * (180 / Math.PI); const h1pf = h1p < 0 ? h1p + 360 : h1p
  const h2p = Math.atan2(b2, a2p) * (180 / Math.PI); const h2pf = h2p < 0 ? h2p + 360 : h2p
  let dhp = h2pf - h1pf
  if (Math.abs(dhp) > 180) dhp += (dhp > 0 ? -360 : 360)
  const avgHp = (Math.abs(h1pf - h2pf) > 180) ? (h1pf + h2pf + 360) / 2 : (h1pf + h2pf) / 2
  const T = 1 - 0.17 * Math.cos((avgHp - 30) * Math.PI / 180)
            + 0.24 * Math.cos((2 * avgHp) * Math.PI / 180)
            + 0.32 * Math.cos(((3 * avgHp) + 6) * Math.PI / 180)
            - 0.20 * Math.cos(((4 * avgHp) - 63) * Math.PI / 180)
  const dLp = L2 - L1
  const dCp = C2p - C1p
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * Math.PI / 180) / 2)
  const Sl = 1 + ((0.015 * Math.pow(avgLp - 50, 2)) / Math.sqrt(20 + Math.pow(avgLp - 50, 2)))
  const Sc = 1 + 0.045 * avgCp
  const Sh = 1 + 0.015 * avgCp * T
  const deltaTheta = 30 * Math.exp(-Math.pow((avgHp - 275) / 25, 2))
  const Rc = 2 * Math.sqrt(Math.pow(avgCp, 7) / (Math.pow(avgCp, 7) + Math.pow(25, 7)))
  const Rt = -Rc * Math.sin(2 * deltaTheta * Math.PI / 180)
  const kl = 1, kc = 1, kh = 1
  const dE = Math.sqrt(
    Math.pow(dLp / (kl * Sl), 2) +
    Math.pow(dCp / (kc * Sc), 2) +
    Math.pow(dHp / (kh * Sh), 2) +
    Rt * (dCp / (kc * Sc)) * (dHp / (kh * Sh))
  )
  return dE
}

function labFromHex(hex) {
  const rgb = hexToRgb(hex)
  const xyz = rgbToXyz(rgb)
  return xyzToLab(xyz)
}

function loadPantone() {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8')
  return JSON.parse(raw)
}

function findClosestPantone(hex) {
  const lab = labFromHex(hex)
  const pantone = loadPantone()
  let best = null
  for (const p of pantone) {
    const labP = labFromHex(p.hex)
    const dE = deltaE00(lab, labP)
    if (!best || dE < best.deltaE) {
      best = { ...p, deltaE: dE }
    }
  }
  return best
}

function logHistory(entry) {
  const line = `${new Date().toISOString()}\t${entry.input}\t${entry.name}\t${entry.number}\t${entry.hex}\tΔE00=${entry.deltaE.toFixed(3)}\n`
  fs.appendFileSync(HISTORY_PATH, line)
}

function exportCSV(pathOut, entry) {
  const header = 'input_hex,pantone_name,pantone_number,pantone_hex,deltaE00\n'
  const row = `${entry.input},${entry.name},${entry.number},${entry.hex},${entry.deltaE.toFixed(3)}\n`
  if (!fs.existsSync(pathOut)) {
    fs.writeFileSync(pathOut, header + row)
  } else {
    fs.appendFileSync(pathOut, row)
  }
}

function exportHTML(pathOut, entry) {
  const html = `<!doctype html><meta charset="utf-8"/>
  <style>
    body{font-family:system-ui,Segoe UI,Arial;padding:24px}
    .swatch{width:140px;height:140px;border-radius:12px;border:1px solid #ddd}
    .row{display:flex;gap:24px;align-items:center}
    .label{font-size:14px;color:#333}
  </style>
  <h1>Comparaison couleur</h1>
  <div class="row">
    <div>
      <div class="swatch" style="background:${entry.input}"></div>
      <div class="label">Entrée ${entry.input}</div>
    </div>
    <div>
      <div class="swatch" style="background:${entry.hex}"></div>
      <div class="label">Pantone ${entry.name} (${entry.number}) — ΔE00=${entry.deltaE.toFixed(3)}</div>
    </div>
  </div>`
  fs.writeFileSync(pathOut, html)
}

function main() {
  const args = parseArgs(process.argv)
  const hex = normalizeHex(args.hex)
  if (!hex) {
    console.error('Usage: pantone-converter <hex> [--export out.csv] [--html compare.html]')
    process.exit(1)
  }
  const match = findClosestPantone(hex)
  const result = { input: hex, ...match }
  console.log(`Hex ${hex} → Pantone ${match.name} (${match.number}) [${match.hex}] ΔE00=${match.deltaE.toFixed(3)}`)
  logHistory(result)
  if (args.export) exportCSV(args.export, result)
  if (args.html) exportHTML(args.html, result)
}

if (require.main === module) main()

