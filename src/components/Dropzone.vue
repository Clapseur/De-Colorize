<template>
  <div class="sm-dropzone">
    <div
      class="dz-wrap"
      :class="{ 'dz-active': isDragging, 'dz-disabled': busy }"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
      @click="openPicker"
    >
      <div class="dz-inner justify-center items-center flex flex-col gap-2">
        <img class="dz-icon max-w-[48px]" aria-hidden="true" src="../assets/upload.png" alt="dropzone icon" />
        <div class="dz-title text-white">Déposez vos images ici</div>
        <div class="dz-sub">ou cliquez pour choisir un fichier localement</div>
        <input
          ref="fileInputRef"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="dz-input"
          @change="onPick"
        />
        <div class="dz-types">Compatibles: .jpg, .jpeg, .png, .webp</div>
        <div v-if="error" class="dz-error">{{ error }}</div>
      </div>
    </div>

    <div v-if="previewUrl" class="dz-preview">
      <img :src="previewUrl" alt="preview" />
      <div class="dz-status">
        <span v-if="paletteColors.length">Palette ready ✓</span>
        <span v-else-if="busy">Processing…</span>
      </div>
    </div>

    <div v-if="paletteColors.length" class="dz-palette">
      <div
        v-for="(c,i) in paletteColors"
        :key="i"
        class="dz-swatch"
        :style="{ background: c }"
        :title="c"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useStore } from '../store/store'
import { useRouter } from 'vue-router'

const store = useStore()
const router = useRouter()

const busy = ref(false)
const isDragging = ref(false)
const error = ref('')
const previewUrl = ref('')
const fileInputRef = ref(null)
const paletteColors = ref([])
const paletteId = ref(null)
const paletteImgUrl = ref('')

function reset(){
  error.value = ''
  paletteColors.value = []
}

function validType(file){
  const okTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (okTypes.includes(file.type)) return true
  const name = file.name.toLowerCase()
  return ['.jpg', '.jpeg', '.png', '.webp'].some(ext => name.endsWith(ext))
}

function openPicker(){
  if (busy.value) return
  const el = fileInputRef.value
  if (el && typeof el.click === 'function') el.click()
}

function onDragOver(){
  if (busy.value) return
  isDragging.value = true
}
function onDragLeave(){
  isDragging.value = false
}
async function onDrop(e){
  isDragging.value = false
  if (busy.value) return
  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  await handleFile(file)
}

function onPick(e){
  const file = e.target.files?.[0]
  if (!file) return
  handleFile(file)
  e.target.value = ''
}

async function sendToPaletteEndpoint(file){
  // Send exactly one minimal Postman-like multipart request: image + filename
  const idempotencyKey = (crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`)
  const safeName = sanitizeFileName(file.name)

  const fd = new FormData()
  fd.append('image', file, safeName)
  fd.append('filename', safeName)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort('timeout'), 20000)

  const API_BASE = (import.meta?.env?.VITE_API_BASE_URL || 'https://workshopb21.vercel.app')
  const url = `${API_BASE}/ADD/ImgPalette`
  const res = await fetch(url, {
    method: 'POST',
    body: fd,
    signal: controller.signal,
    headers: {
      'X-Request-Id': idempotencyKey,
      'Idempotency-Key': idempotencyKey
    },
  })

  clearTimeout(timeout)
 // message d'erreur indiquant un fallback si impossibilité de contacter le serv distant
  if (!res.ok || res.status !== 200) {
    const text = await res.text().catch(() => '')
    console.error('[dropzone] upload failed', res.status, text)
    throw new Error(`Erreur serveur ${res.status}: ${text || 'Internal Server Error'}`)
  }

  const ct = res.headers.get('content-type') || ''
  let data
  if (ct.includes('application/json')) {
    data = await res.json()
  } else {
    const text = await res.text()
    try { data = JSON.parse(text) } catch { data = { raw: text } }
  }

  // récupe l'ID de la peltte
  const id = data?.palette?.id || data?.palette || data?.id || data?.result?.id || data?.data?.id
  if (!id) {
    throw new Error('Réponse distante sans identifiant de palette')
  }
  paletteId.value = id

  // fetch palette by id
  const pullUrl = `${API_BASE}/PULL/palette/id`
  const pullRes = await fetch(pullUrl, {
     method: 'POST',
     body: JSON.stringify({
       "uuid": paletteId.value
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  if (!pullRes.ok) {
    const t = await pullRes.text().catch(() => '')
    throw new Error(`Echec de récupération de palette ${pullRes.status}: ${t}`)
  }
  const pullCT = pullRes.headers.get('content-type') || ''
  let pullData
  if (pullCT.includes('application/json')) {
    pullData = await pullRes.json()
  } else {
    const t = await pullRes.text()
    try { pullData = JSON.parse(t) } catch { pullData = { raw: t } }
  }
  // Attendu: 5 couleurs sous "hexadecimal" et lien image sous "link_img"
  const hexes = pullData?.hexadecimal
    || pullData?.palette?.hexadecimal
    || pullData?.data?.hexadecimal
  const imgLink = pullData?.link_img
    || pullData?.palette?.link_img
    || pullData?.data?.link_img
  if (Array.isArray(hexes) && hexes.length) {
    paletteColors.value = hexes
  } else {
    // Fallback: anciennes structures
    const pal = pullData?.palette || pullData?.colors || pullData?.result?.palette || pullData?.data?.palette
    if (Array.isArray(pal) && pal.length) {
      paletteColors.value = pal
    } else {
      throw new Error('Palette introuvable pour l’identifiant reçu')
    }
  }
  if (typeof imgLink === 'string' && imgLink) {
    paletteImgUrl.value = imgLink
  }
}

async function handleFile(file){
  reset()
  if (!validType(file)){
    error.value = 'Type de fichier non valide. Utilisez jpg, jpeg, png, ou webp.'
    return
  }
  previewUrl.value = URL.createObjectURL(file)
  busy.value = true
  let usedFallback = false
  try {
    await sendToPaletteEndpoint(file)
  } catch (err) {
    // Non-fatal: remote failed; try local fallback
    console.warn('[dropzone] remote palette failed, using local fallback', err)
    try {
      const pal = await extractPaletteLocally(file)
      if (Array.isArray(pal) && pal.length) {
        paletteColors.value = pal
        usedFallback = true
        // Alert header for non-fatal error
        store.dispatch('notifications/addAlert', { message: 'Service distant indisponible, palette générée localement', type: 'error', duration: 5000 })
      } else {
        throw err
      }
    } catch (e2) {
      error.value = err?.message || 'Traitement échoué'
    }
  } finally {
    busy.value = false
  }

  // If palette is ready, dispatch to store and navigate
  if (paletteColors.value.length) {
    store.dispatch('palette/setPalette', {
      imageUrl: paletteImgUrl.value || previewUrl.value,
      fileName: file.name,
      colors: paletteColors.value,
      id: paletteId.value
    })
    // Success banner for 2s
    store.dispatch('notifications/addAlert', { message: 'Palette Generated', type: 'success', duration: 2000 })
    setTimeout(() => { router.push('/color') }, 2000)
  }
}

async function computeChecksumSha256(file){
  const buf = await file.arrayBuffer()
  const hash = await crypto.subtle.digest('SHA-256', buf)
  const bytes = new Uint8Array(hash)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

function sanitizeFileName(name){
  return name
    .replace(/[^a-zA-Z0-9_.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 200)
}

// Local palette fallback using Canvas + k-means
async function extractPaletteLocally(file, k = 6){
  const imageData = await getImageDataFromFile(file, 180)
  const { data } = imageData
  const pixels = []
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (a < 200) continue // skip highly transparent
    const r = data[i], g = data[i + 1], b = data[i + 2]
    pixels.push([r, g, b])
  }
  // Sample to reduce computation
  const maxSamples = 6000
  if (pixels.length > maxSamples) {
    const step = Math.max(1, Math.floor(pixels.length / maxSamples))
    const sampled = []
    for (let i = 0; i < pixels.length; i += step) sampled.push(pixels[i])
    // Avoid empty
    if (sampled.length) {
      while (sampled.length > maxSamples) sampled.pop()
      // eslint-disable-next-line
      pixels.splice(0, pixels.length, ...sampled)
    }
  }
  if (!pixels.length) return []
  const centroids = kMeans(pixels, k, 10)
  return centroids.map(([r, g, b]) => rgbToHex(r, g, b))
}

function rgbToHex(r, g, b){
  const toHex = (v) => v.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function kMeans(pixels, k = 6, maxIter = 10){
  // Initialize centroids by spread across dataset
  const centroids = []
  const step = Math.max(1, Math.floor(pixels.length / k))
  for (let i = 0; i < k; i++) {
    centroids.push(pixels[Math.min(pixels.length - 1, i * step)])
  }
  for (let iter = 0; iter < maxIter; iter++) {
    const clusters = Array.from({ length: k }, () => ({ sum: [0,0,0], count: 0 }))
    for (const p of pixels) {
      let best = 0, bestD = Infinity
      for (let j = 0; j < k; j++) {
        const c = centroids[j]
        const dr = p[0] - c[0], dg = p[1] - c[1], db = p[2] - c[2]
        const d = dr*dr + dg*dg + db*db
        if (d < bestD) { bestD = d; best = j }
      }
      const cl = clusters[best]
      cl.sum[0] += p[0]; cl.sum[1] += p[1]; cl.sum[2] += p[2]
      cl.count++
    }
    let shift = 0
    for (let j = 0; j < k; j++) {
      if (!clusters[j].count) continue
      const newC = [
        Math.round(clusters[j].sum[0] / clusters[j].count),
        Math.round(clusters[j].sum[1] / clusters[j].count),
        Math.round(clusters[j].sum[2] / clusters[j].count),
      ]
      const c = centroids[j]
      shift += Math.abs(newC[0] - c[0]) + Math.abs(newC[1] - c[1]) + Math.abs(newC[2] - c[2])
      centroids[j] = newC
    }
    if (shift < 1) break
  }
  // Sort by cluster frequency
  const counts = Array(k).fill(0)
  for (const p of pixels) {
    let best = 0, bestD = Infinity
    for (let j = 0; j < k; j++) {
      const c = centroids[j]
      const dr = p[0] - c[0], dg = p[1] - c[1], db = p[2] - c[2]
      const d = dr*dr + dg*dg + db*db
      if (d < bestD) { bestD = d; best = j }
    }
    counts[best]++
  }
  const order = Array.from({ length: k }, (_, i) => i).sort((a, b) => counts[b] - counts[a])
  return order.map(i => centroids[i])
}

async function getImageDataFromFile(file, targetSize = 180){
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    const scale = Math.min(1, Math.max(targetSize / img.width, targetSize / img.height))
    const w = Math.max(1, Math.round(img.width * scale))
    const h = Math.max(1, Math.round(img.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(img, 0, 0, w, h)
    return ctx.getImageData(0, 0, w, h)
  } finally {
    URL.revokeObjectURL(url)
  }
}

function loadImage(src){
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(e)
    img.src = src
  })
}
</script>

<style scoped>
.sm-dropzone{
  display:flex;
  flex-direction:column;
  gap:1rem;
}
.dz-wrap{
  position:relative;
  border:2px dashed #fff;
  border-radius:16px;
  padding:1.25rem;
  cursor:pointer;
}
.dz-wrap.dz-active{
  border-color:#fff;
  box-shadow:0 0 0 4px #fff;
}
.dz-wrap.dz-disabled{
  opacity:0.6;
  pointer-events:none;
}
.dz-inner{
  position:relative;
  text-align:center;
}
.dz-icon{ font-size:2rem; }
.dz-title{ font-weight:600; }
.dz-sub{ color:#ccc; font-size:.9rem; }
.dz-input{
  position:absolute;
  inset:0;
  opacity:0;
  width:100%;
  height:100%;
  cursor:pointer;
  pointer-events:none;
}
.dz-types{ font-size:.8rem; color:#ccc; margin-top:.5rem; }
.dz-error{ font-size:.85rem; color:#d22; margin-top:.35rem; }

.dz-preview{ display:flex; align-items:center; gap:.75rem; }
.dz-preview img{ width:72px; height:72px; object-fit:cover; border-radius:12px; border:1px solid #fff; }
.dz-status{ font-size:.9rem; color:#ccc; }

.dz-palette{ display:flex; flex-wrap:wrap; gap:.5rem; margin-top:.5rem; }
.dz-swatch{ width:28px; height:28px; border-radius:6px; border:1px solid #fff2; }
</style>
