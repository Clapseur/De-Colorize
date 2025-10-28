<script setup>
import { ref, computed, onMounted } from 'vue'
import TextType from './TextAnimations/TextType/TextType.vue'

const prompts = [
  'vaporwave',
  'couché de soleil',
  'forêt',
  'campagne',
  'ville de nuit',
]

const query = ref('')
const errorMsg = ref('')
const loading = ref(false)
const palettes = ref([])

function hashStringToNumber(str){
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function hslToHex(h, s, l){
  s = Math.max(0, Math.min(1, s))
  l = Math.max(0, Math.min(1, l))
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r1=0,g1=0,b1=0
  if (0<=h && h<60){ r1=c; g1=x; b1=0 }
  else if (60<=h && h<120){ r1=x; g1=c; b1=0 }
  else if (120<=h && h<180){ r1=0; g1=c; b1=x }
  else if (180<=h && h<240){ r1=0; g1=x; b1=c }
  else if (240<=h && h<300){ r1=x; g1=0; b1=c }
  else { r1=c; g1=0; b1=x }
  const r = Math.round((r1 + m) * 255)
  const g = Math.round((g1 + m) * 255)
  const b = Math.round((b1 + m) * 255)
  const toHex = (v) => v.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

async function fetchAIPalettes(text){
  errorMsg.value = ''
  loading.value = true
  try {
    // Use existing create/pull palette IA flow
    const words = (text || '').split(/\s+/).filter(Boolean)
    const API_BASE = (import.meta?.env?.VITE_API_BASE_URL || 'https://workshopb21.vercel.app')
    const createUrl = `${API_BASE}/ADD/palette/ia`
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ words })
    })
    if (!createRes.ok) {
      const t = await createRes.text().catch(() => '')
      throw new Error(t || `HTTP ${createRes.status}`)
    }
    const ct = createRes.headers.get('content-type') || ''
    let createData
    if (ct.includes('application/json')) {
      createData = await createRes.json()
    } else {
      const tt = await createRes.text()
      try { createData = JSON.parse(tt) } catch { createData = { raw: tt } }
    }
    const id = createData?.palette?.id
      || createData?.palette_id
      || createData?.palette
      || createData?.id
      || createData?.result?.id
      || createData?.data?.id
    if (!id) throw new Error('Server response did not include a palette ID')

    const pullUrl = `${API_BASE}/PULL/palette/id`
    const pullRes = await fetch(pullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uuid: id })
    })
    if (!pullRes.ok) {
      const t = await pullRes.text().catch(() => '')
      throw new Error(t || `HTTP ${pullRes.status}`)
    }
    const pullCT = pullRes.headers.get('content-type') || ''
    let pullData
    if (pullCT.includes('application/json')) {
      pullData = await pullRes.json()
    } else {
      const t = await pullRes.text()
      try { pullData = JSON.parse(t) } catch { pullData = { raw: t } }
    }
    const hexes = pullData?.hexadecimal
      || pullData?.palette?.hexadecimal
      || pullData?.data?.hexadecimal
    let colors = []
    if (Array.isArray(hexes) && hexes.length) {
      colors = hexes.slice(0, 5)
    } else {
      const pal = pullData?.palette || pullData?.colors || pullData?.result?.palette || pullData?.data?.palette
      if (Array.isArray(pal) && pal.length) {
        colors = pal.slice(0, 5)
      }
    }
    if (!colors.length) throw new Error('No palette found for received ID')
    palettes.value = [{ title: text || 'Palette', colors }]
  } catch (e) {
    // Fallback: local generation when remote fails
    const base = hashStringToNumber(text || 'default')
    const count = 8
    const generated = Array.from({ length: count }, (_, idx) => {
      const seed = base + idx * 997
      const h = seed % 360
      const s = 0.5 + ((seed % 200) / 200) * 0.3
      const lBase = 0.3 + ((seed % 300) / 300) * 0.4
      const colors = Array.from({ length: 5 }, (__, i) => {
        const l = Math.max(0.12, Math.min(0.88, lBase + (i - 2) * 0.08))
        return hslToHex(h, s, l)
      })
      return { title: `${text} · ${idx+1}`, colors }
    })
    palettes.value = generated
  } finally {
    loading.value = false
  }
}

function onSubmit(){
  const q = (query.value || '').trim()
  if (!q) {
    errorMsg.value = 'Please enter a prompt.'
    return
  }
  fetchAIPalettes(q)
}

onMounted(() => {
  fetchAIPalettes(prompts[0])
})
</script>

<template>
  <section class="container mx-auto px-4 py-10 text-white">
    <!-- AI Color Section -->
    <div class="mx-auto max-w-3xl p-6 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-xl shadow-lg">
      <h2 class="text-2xl font-semibold mb-3">Explore Palettes with AI</h2>
      <div class="text-sm text-white/70 mb-4">
        <TextType
          :text="prompts"
          :textColors="['#a5b4fc', '#fca5a5', '#86efac']"
          className="font-mono"
          :pauseDuration="1600"
          :initialDelay="300"
        />
      </div>
      <div class="flex items-center gap-3">
        <input
          v-model="query"
          type="text"
          placeholder="Describe a mood, style, or scene (press Enter)"
          class="flex-1 px-4 py-2 rounded-full bg-transparent border border-white/40 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
          aria-label="AI color prompt"
          @keyup.enter="onSubmit"
        />
      </div>
      <p v-if="errorMsg" class="mt-2 text-sm text-red-300" role="alert">{{ errorMsg }}</p>
      <p v-if="loading" class="mt-2 text-sm text-white/70">Generating palettes…</p>
    </div>

    <!-- Masonry Grid -->
    <div class="mt-10">
      <div class="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
        <div
          v-for="(pal, i) in palettes"
          :key="i"
          class="break-inside-avoid rounded-2xl border border-white/15 bg-white/5 shadow p-4 mb-4"
        >
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold">{{ pal.title || 'Palette' }}</h3>
            <span class="text-xs text-white/60">{{ pal.colors?.length || 0 }} colors</span>
          </div>
          <div class="flex gap-2">
            <div
              v-for="(c, idx) in pal.colors"
              :key="idx"
              class="relative rounded-lg border border-white/10 overflow-hidden flex-1 min-w-0"
              :style="{ backgroundColor: c }"
              :aria-label="`Color ${c}`"
            >
              <div class="w-full aspect-square"></div>
              <span class="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-black/30">{{ c }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.break-inside-avoid { break-inside: avoid; }
</style>
