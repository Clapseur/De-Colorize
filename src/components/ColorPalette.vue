<script setup>
import { ref, nextTick } from 'vue'

const imageFile = ref(null)
const imageUrl = ref('')
const palette = ref([])
const selectedColor = ref('')
const shades = ref([])

const canvasRef = ref(null)

const onFileChange = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  imageFile.value = file
  const reader = new FileReader()
  reader.onload = (ev) => {
    imageUrl.value = ev.target.result
    try {
      const saved = JSON.parse(localStorage.getItem('images') || '[]')
      saved.unshift({ name: file.name, dataUrl: imageUrl.value, ts: Date.now() })
      localStorage.setItem('images', JSON.stringify(saved.slice(0, 10)))
    } catch {}
    nextTick(extractColors)
  }
  reader.readAsDataURL(file)
}

const extractColors = async () => {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = imageUrl.value
  await img.decode().catch(() => {})

  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  const maxW = 200
  const scale = Math.min(1, maxW / (img.width || maxW))
  const w = Math.max(1, Math.floor((img.width || maxW) * scale))
  const h = Math.max(1, Math.floor((img.height || maxW) * scale))
  canvas.width = w
  canvas.height = h
  ctx.drawImage(img, 0, 0, w, h)
  const data = ctx.getImageData(0, 0, w, h).data

  const samples = []
  const step = 4 * 10
  for (let i = 0; i < data.length; i += step) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    samples.push([r, g, b])
  }

  const centers = kmeans(samples, 5, 8)
  const hexes = centers.map(rgbToHex)
  palette.value = dedupe(hexes)
}

const kmeans = (points, k, iterations) => {
  const centers = []
  for (let i = 0; i < k; i++) {
    const p = points[Math.floor(Math.random() * points.length)]
    centers.push([...p])
  }
  for (let iter = 0; iter < iterations; iter++) {
    const clusters = Array.from({ length: k }, () => [])
    for (const p of points) {
      let best = 0
      let bestD = Infinity
      for (let i = 0; i < k; i++) {
        const d = dist(p, centers[i])
        if (d < bestD) { bestD = d; best = i }
      }
      clusters[best].push(p)
    }
    for (let i = 0; i < k; i++) {
      const c = clusters[i]
      if (!c.length) continue
      const avg = [0, 0, 0]
      for (const p of c) { avg[0] += p[0]; avg[1] += p[1]; avg[2] += p[2] }
      centers[i] = [avg[0]/c.length, avg[1]/c.length, avg[2]/c.length]
    }
  }
  return centers
}

const dist = (a, b) => {
  const dr = a[0]-b[0], dg = a[1]-b[1], db = a[2]-b[2]
  return dr*dr + dg*dg + db*db
}

const dedupe = (hexes) => {
  const seen = new Set()
  const res = []
  for (const h of hexes) {
    const key = h.toLowerCase()
    if (!seen.has(key)) { seen.add(key); res.push(h) }
  }
  return res.slice(0,5)
}

const rgbToHex = ([r,g,b]) => '#' + [r,g,b].map(x => {
  const v = Math.round(Math.max(0, Math.min(255, x)))
  return v.toString(16).padStart(2, '0')
}).join('')

const hexToHsl = (hex) => {
  const r = parseInt(hex.slice(1,3),16)/255
  const g = parseInt(hex.slice(3,5),16)/255
  const b = parseInt(hex.slice(5,7),16)/255
  const max = Math.max(r,g,b), min = Math.min(r,g,b)
  let h = 0, s = 0, l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch(max){
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  return { h, s, l }
}

const hslToHex = ({h,s,l}) => {
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1/6) return p + (q - p) * 6 * t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
    return p
  }
  let r, g, b
  if (s === 0) {
    r = g = b = l
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }
  const toHex = (x) => Math.round(x * 255).toString(16).padStart(2,'0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

const generateScale = (hex) => {
  const { h, s } = hexToHsl(hex)
  const list = []
  for (let i = 0; i < 10; i++) {
    const l = 0.05 + (i * (0.9/9))
    list.push(hslToHex({ h, s, l }))
  }
  shades.value = list
}

const onSelectColor = (hex) => {
  selectedColor.value = hex
  generateScale(hex)
}
</script>

<template>
  <div class="max-w-3xl mx-auto p-5">
    <h2 class="text-2xl font-bold mb-4">Palette</h2>
    <div class="mb-4">
      <input type="file" accept="image/*" @change="onFileChange" class="block" />
    </div>
    <div v-if="imageUrl" class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div>
        <img :src="imageUrl" alt="Uploaded" class="max-w-full rounded" />
      </div>
      <div>
        <canvas ref="canvasRef" class="w-full h-auto hidden"></canvas>
        <div class="mb-2 font-semibold">Top 5 colors</div>
        <div class="grid grid-cols-5 gap-2">
          <button
            v-for="c in palette"
            :key="c"
            class="h-12 rounded border border-gray-300"
            :style="{ backgroundColor: c }"
            @click="onSelectColor(c)"
            :aria-label="`Select color ${c}`"
          />
        </div>
      </div>
    </div>

    <div v-if="selectedColor" class="mb-6">
      <div class="mb-2 font-semibold">Shades and tints</div>
      <div class="grid grid-cols-5 gap-2">
        <div v-for="s in shades" :key="s" class="h-12 rounded border border-gray-300" :style="{ backgroundColor: s }"></div>
      </div>
    </div>
  </div>
</template>