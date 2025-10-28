<template>
  <div class="container mx-auto p-4 text-white mt-4">
    <h1 class="text-2xl font-semibold mb-4">Color Palette</h1>

    <MagicBento
      :use-slot="true"
      :enable-spotlight="false"
      :enable-stars="false"
      :enable-border-glow="true"
      :disable-animations="false"
      :spotlight-radius="260"
      glow-color="255, 255, 255"
      :enable-tilt="false"
      :click-effect="true"
      :enable-magnetism="true"
    >
      <!-- Custom Bento Grid matching provided sketch -->
      <div class="bento-grid">
        <!-- IMAGE (top-left) -->
        <div class="bento-item image">
          <div class="card card--border-glow bg-white/15 rounded-[20px] border border-white/10 p-5">
            <h2 class="text-sm font-medium mb-3">Image</h2>
            <div class="w-full bg-black/20 rounded-xl overflow-hidden border border-white/10">
              <img
                v-if="palette?.imageUrl"
                :src="palette.imageUrl"
                alt="Uploaded"
                class="object-contain w-full max-h-[280px]"
              />
              <div v-else class="p-6 text-sm text-white/70">No image available.</div>
            </div>
          </div>
        </div>

        <!-- PALETTE (below image) -->
        <div class="bento-item palette">
          <div class="card card--border-glow bg-white/15 rounded-[20px] border border-white/10 p-5">
            <h2 class="text-sm font-medium mb-3">Palette</h2>
            <div class="flex flex-col gap-2">
              <button
                v-for="(c, idx) in primaryColors"
                :key="idx"
                class="relative h-10 w-full rounded-lg border border-white/15 focus:outline-none"
                :style="{ backgroundColor: c }"
                @click="selectColor(c)"
              >
                <span class="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-black/30">{{ c }}</span>
                <span v-if="c === selectedColor" class="absolute top-1 right-1 text-[10px] px-1 py-0.5 rounded bg-white/20">Selected</span>
              </button>
            </div>
          </div>
        </div>

        <!-- HUE OF DARKER AND LIGHTER SHADE (top row spanning) -->
        <div class="bento-item hue">
          <div class="card card--border-glow bg-white/15 rounded-[20px] border border-white/10 p-5">
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-sm font-medium">Hue of darker and lighter shade</h2>
              <div class="flex items-center gap-3">
                <div class="h-7 w-7 rounded-md border border-white/20" :style="{ backgroundColor: selectedColor }" />
                <span class="text-xs">{{ selectedColor }}</span>
                <button
                  class="px-3 py-1 text-xs rounded-md border border-white/20 hover:bg-white/10"
                  @click="copySelectedColor()"
                >Copy</button>
              </div>
            </div>
            <div class="grid grid-cols-10 gap-2">
              <div
                v-for="(v, i) in selectedVariations"
                :key="i"
                class="h-12 rounded-lg border border-white/10 flex items-end justify-start"
                :style="{ backgroundColor: v }"
              >
                <span class="text-[10px] m-1 px-1 py-0.5 rounded bg-black/25">{{ v }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- DESIGN SYSTEM (center, wide) -->
        <div class="bento-item design">
          <div class="card card--border-glow bg-white/15 rounded-[20px] border border-white/10 p-5">
            <h2 class="text-lg font-medium mb-2">Design System</h2>
            <p class="text-sm text-white/70">Reserved for tokens, type scale, spacing, and components.</p>
          </div>
        </div>

        <!-- PANTONE EQUIVALENT (tall right column) -->
        <div class="bento-item pantone">
          <div class="card card--border-glow bg-white/15 rounded-[20px] border border-white/10 p-5">
            <h2 class="text-lg font-medium mb-2">Pantone Equivalent</h2>
            <p class="text-sm text-white/70">Nearest Pantone matches will appear here.</p>
          </div>
        </div>

        <!-- SUGGESTED PALETTES (bottom wide) -->
        <div class="bento-item suggest">
          <div class="card card--border-glow bg-white/15 rounded-[20px] border border-white/10 p-5">
            <h2 class="text-lg font-medium mb-2">Suggested Palettes</h2>
            <p class="text-sm text-white/70">Suggestions based on image or selected base color.</p>
          </div>
        </div>
      </div>
    </MagicBento>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import MagicBento from './MagicBento/MagicBento.vue'
import { useStore } from '../store/store.js'

const store = useStore()

const palette = computed(() => store.state.palette)
const primaryColors = computed(() => palette.value?.colors || [])

const internalSelected = ref(null)
const selectedColor = computed(() => internalSelected.value || palette.value?.primaryColor || primaryColors.value[0] || '#000000')

function selectColor(c) {
  internalSelected.value = c
  // Fetch dynamic hues for the newly selected color
  fetchAndApplySelectedColor(c)
}

function copySelectedColor() {
  navigator.clipboard.writeText(selectedColor.value)
}

// Validation helpers
function isValidHex(hex) {
  if (!hex) return false
  return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex.trim())
}
function normalizeHex(hex) {
  if (!hex) return ''
  let h = hex.trim()
  if (!h.startsWith('#')) h = `#${h}`
  return h.toLowerCase()
}

// API-driven hues per palette color (replaces local hue algorithm)
const hueGrid = ref([])    // 10 colors applied at once to the grid
const selectedVariations = computed(() => hueGrid.value)
const hueLoading = ref(false)

function extractColorsFromResponse(data) {
  // Helper: identify hex string
  const isHexStr = (v) => typeof v === 'string' && isValidHex(v)
  // Helper: recursively collect hexes from arrays/objects
  const collect = (val, depth = 0) => {
    if (!val || depth > 3) return []
    if (isHexStr(val)) return [normalizeHex(val)]
    if (Array.isArray(val)) {
      return val.flatMap((x) => collect(x, depth + 1))
    }
    if (typeof val === 'object') {
      const keys = Object.keys(val)
      // If object has numeric shade keys, sort for consistent order
      const numericKeys = keys.filter((k) => /^\d{2,3}$/.test(k))
      if (numericKeys.length >= 5) {
        return numericKeys
          .sort((a, b) => parseInt(a) - parseInt(b))
          .flatMap((k) => collect(val[k], depth + 1))
      }
      return keys.flatMap((k) => collect(val[k], depth + 1))
    }
    return []
  }

  const candidates = [
    data,
    data?.colors,
    data?.palette,
    data?.nuances,
    data?.hues,
    data?.shades,
    data?.values,
    data?.list,
    data?.data,
  ]

  const hexes = candidates.flatMap((c) => collect(c))
  const unique = Array.from(new Set(hexes))
  return unique.slice(0, 10)
}

async function fetchNuanceForColor(hex) {
  const color = normalizeHex(hex)
  if (!isValidHex(color)) {
    console.warn('[nuance] invalid color provided', hex)
    return { ok: false, colors: [] }
  }
  try {
    const payload = { color }
    console.log('[nuance:request]', 'POST /PULL/nuance', payload)
    hueLoading.value = true
    const res = await fetch('https://workshopb21.vercel.app/PULL/nuance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const status = res.status
    if (!res.ok) throw new Error(`HTTP ${status}`)
    const data = await res.json().catch(() => ({}))
    const colors = extractColorsFromResponse(data)
    const keys = data && typeof data === 'object' ? Object.keys(data) : []
    console.log('[nuance:response]', { status, keys, extractedCount: colors.length, sample: colors.slice(0, 10) })
    return { ok: true, colors }
  } catch (e) {
    console.error('[nuance:error]', e)
    return { ok: false, colors: [] }
  } finally {
    hueLoading.value = false
  }
}

async function fetchAndApplySelectedColor(hex) {
  const r = await fetchNuanceForColor(hex)
  if (r.ok && r.colors.length) {
    // Apply all 10 (or fewer) colors at once for visual consistency
    hueGrid.value = r.colors
  } else {
    // Fallback: keep previous hues to avoid visual jump
    console.warn('[nuance:fallback] keeping existing hue grid')
  }
}

onMounted(() => {
  if (!internalSelected.value && primaryColors.value?.length) {
    internalSelected.value = primaryColors.value[0]
  }
  // Initial fetch for selected color if palette exists
  if (palette.value?.colors?.length) {
    fetchAndApplySelectedColor(selectedColor.value)
  }
})

// When the palette changes (new upload), re-fetch for current selection
watch(() => palette.value?.colors, () => {
  if (palette.value?.colors?.length) fetchAndApplySelectedColor(selectedColor.value)
})
</script>

<style scoped>
.container { max-width: 1400px; }

/* Grid layout that matches the provided sketch */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-auto-rows: minmax(140px, auto);
  gap: 0.5rem;
}

@media (min-width: 1024px) {
  .bento-grid {
    grid-template-areas:
      "image image image hue hue hue hue hue hue hue hue hue"
      "palette palette palette design design design design design design pantone pantone pantone"
      
      " . . . suggest suggest suggest suggest suggest suggest pantone pantone pantone";
  }
}

@media (max-width: 1023px) {
  .bento-grid {
    grid-template-columns: 1fr;
    grid-template-areas:
      "image"
      "palette"
      "hue"
      "pantone"
      "design"
      "suggest";
  }
}

.bento-item.image { grid-area: image; }
.bento-item.palette { grid-area: palette; }
.bento-item.hue { grid-area: hue; }
.bento-item.design { grid-area: design; }
.bento-item.pantone { grid-area: pantone; }
.bento-item.suggest { grid-area: suggest; }
</style>
