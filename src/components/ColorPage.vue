<template>
  <div class="container mx-auto p-4 text-white mt-4">
    <h1 class="text-2xl font-semibold mb-4">Palette de couleurs</h1>

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
              <div
                v-for="(c, idx) in primaryColors"
                :key="idx"
                class="relative h-10 w-full rounded-lg border border-white/15 cursor-pointer"
                :style="{ backgroundColor: c }"
                @click="selectColor(c)"
                role="img"
                :aria-label="`Palette color ${c}`"
              >
                <span class="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-black/30">{{ c }}</span>
                <span v-if="c === selectedColor" class="absolute top-1 right-1 text-[10px] px-1 py-0.5 rounded bg-white/20">Selected</span>
              </div>
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
              </div>
            </div>
            <div class="grid grid-cols-10 gap-2">
              <div
                v-for="(v, i) in selectedVariations"
                :key="i"
                class="h-10 rounded-lg border border-white/10 flex items-end justify-start"
                :style="{ backgroundColor: v }"
              >
                <span class="text-[10px] m-1 px-1 py-0.5 rounded bg-black/25">{{ v }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- PANTONE EQUIVALENT (single top match with overlay text) -->
        <div class="bento-item pantone">
          <!-- Square sampled Pantone color placed above Pantone elements -->
          <div
            class="pantone-sample"
            :style="{ backgroundColor: (bestPantone && bestPantone.hex) || selectedColor }"
            aria-label="Pantone sampled color"
          ></div>

          <div class="pantone-card" v-if="bestPantone">
            <!-- Swatch area: exact solid sRGB color (no overlays) -->
            <div 
              class="pantone-swatch" 
              :style="{ backgroundColor: bestPantone.hex }"
              @click="copyPantoneCode(bestPantone.code)"
              :title="`Cliquer pour copier: ${bestPantone.code}`"
            ></div>
            <!-- Footer strip: match Pantone reference layout -->
            <div class="pantone-footer">
              <div class="pantone-footer-brand">PANTONE</div>
              <div class="pantone-footer-name">{{ bestPantone.name.replace('Pantone ', '') }}</div>
              <div class="pantone-footer-code">{{ bestPantone.code }}</div>
            </div>
            <div class="pantone-meta">
              <div class="pantone-resemblance">Resemblance {{ resemblancePercent }}%</div>
            </div>
          </div>
          <div v-else-if="pantoneLoading" class="flex items-center justify-center py-8">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-white/60"></div>
            <span class="ml-2 text-sm text-white/70">Recherche Pantone...</span>
          </div>
          <p v-else class="text-sm text-white/70">La correspondance Pantone la plus proche apparaîtra ici.</p>
        </div>

      <!-- SUGGESTED PALETTES (bottom wide) -->
      <div class="bento-item suggest">
        <div class="card card--border-glow bg-white/15 rounded-[20px] border border-white/10 p-5">
          <h2 class="text-lg font-medium mb-3">Palettes suggérées</h2>
          <div v-if="suggestedPalettes.length > 0" class="space-y-3">
              <div 
                v-for="(palette, idx) in suggestedPalettes" 
                :key="idx"
                class="bg-white/5 rounded-lg p-3 border border-white/5 hover:border-white/20 transition-colors cursor-pointer"
                @click="applySuggestedPalette(palette)"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-medium text-white/90">{{ palette.name }}</span>
                  <span class="text-xs text-white/60">{{ palette.colors.length }} couleurs</span>
                </div>
                <div class="flex gap-1">
                  <div 
                    v-for="(color, colorIdx) in palette.colors.slice(0, 8)" 
                    :key="colorIdx"
                    class="h-6 w-6 rounded border border-white/10 flex-shrink-0"
                    :style="{ backgroundColor: color }"
                    :title="color"
                  ></div>
                  <div v-if="palette.colors.length > 8" class="h-6 w-6 rounded border border-white/10 flex items-center justify-center text-xs text-white/60">
                    +{{ palette.colors.length - 8 }}
                  </div>
                </div>
              </div>
            </div>
            <div v-else-if="suggestionsLoading" class="flex items-center justify-center py-8">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-white/60"></div>
              <span class="ml-2 text-sm text-white/70">Génération de suggestions...</span>
            </div>
          <p v-else class="text-sm text-white/70">Suggestions basées sur l'image ou la couleur sélectionnée.</p>
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

// Color theory algorithms for palette generation
function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2
  
  if (max === min) {
    h = s = 0 // achromatic
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  
  return [h * 360, s * 100, l * 100]
}

function hslToHex(h, s, l) {
  h = h / 360
  s = s / 100
  l = l / 100
  
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
    r = g = b = l // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }
  
  const toHex = (c) => {
    const hex = Math.round(c * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function generateComplementaryPalette(baseHex) {
  const [h, s, l] = hexToHsl(baseHex)
  const complementaryH = (h + 180) % 360
  
  return [
    baseHex,
    hslToHex(complementaryH, s, l),
    hslToHex(h, Math.max(0, s - 20), Math.min(100, l + 15)),
    hslToHex(complementaryH, Math.max(0, s - 20), Math.min(100, l + 15)),
    hslToHex(h, Math.min(100, s + 15), Math.max(0, l - 20))
  ]
}

function generateAnalogousPalette(baseHex) {
  const [h, s, l] = hexToHsl(baseHex)
  
  return [
    baseHex,
    hslToHex((h + 30) % 360, s, l),
    hslToHex((h - 30 + 360) % 360, s, l),
    hslToHex((h + 60) % 360, Math.max(0, s - 10), Math.min(100, l + 10)),
    hslToHex((h - 60 + 360) % 360, Math.max(0, s - 10), Math.min(100, l + 10))
  ]
}

function generateTriadicPalette(baseHex) {
  const [h, s, l] = hexToHsl(baseHex)
  
  return [
    baseHex,
    hslToHex((h + 120) % 360, s, l),
    hslToHex((h + 240) % 360, s, l),
    hslToHex(h, Math.max(0, s - 15), Math.min(100, l + 20)),
    hslToHex((h + 120) % 360, Math.max(0, s - 15), Math.max(0, l - 20))
  ]
}

function generateMonochromaticPalette(baseHex) {
  const [h, s, l] = hexToHsl(baseHex)
  
  return [
    baseHex,
    hslToHex(h, s, Math.min(100, l + 25)),
    hslToHex(h, s, Math.max(0, l - 25)),
    hslToHex(h, Math.max(0, s - 20), Math.min(100, l + 15)),
    hslToHex(h, Math.min(100, s + 20), Math.max(0, l - 15))
  ]
}

// API-driven hues per palette color (replaces local hue algorithm)
const hueGrid = ref([])    // 10 colors applied at once to the grid
const selectedVariations = computed(() => hueGrid.value)
const hueLoading = ref(false)

// Suggested palettes functionality
const suggestedPalettes = ref([])
const suggestionsLoading = ref(false)

// Pantone integration functionality
const pantoneMatches = ref([])
const pantoneLoading = ref(false)

// Top Pantone match and resemblance percent (derived from Delta E)
const bestPantone = computed(() => {
  return pantoneMatches.value && pantoneMatches.value.length
    ? pantoneMatches.value[0]
    : null
})

function deltaEToPercent(deltaE) {
  // Visual-only mapping: 0 → 100%, ~30+ → ~10%
  // Keeps algorithms intact, only affects presentation.
  const scaled = Math.max(0, 100 - deltaE * 3)
  return Math.round(Math.min(100, scaled))
}

const resemblancePercent = computed(() => {
  return bestPantone.value ? deltaEToPercent(bestPantone.value.deltaE) : 0
})

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

// Generate suggested palettes based on current palette or selected color
async function generateSuggestedPalettes() {
  if (!selectedColor.value || suggestionsLoading.value) return
  
  suggestionsLoading.value = true
  try {
    // Generate complementary palette
    const complementary = generateComplementaryPalette(selectedColor.value)
    
    // Generate analogous palette
    const analogous = generateAnalogousPalette(selectedColor.value)
    
    // Generate triadic palette
    const triadic = generateTriadicPalette(selectedColor.value)
    
    // Generate monochromatic palette
    const monochromatic = generateMonochromaticPalette(selectedColor.value)
    
    suggestedPalettes.value = [
      { name: 'Complémentaire', colors: complementary },
      { name: 'Analogue', colors: analogous },
      { name: 'Triadique', colors: triadic },
      { name: 'Monochromatique', colors: monochromatic }
    ]
  } catch (error) {
    console.error('[suggestions:error]', error)
    suggestedPalettes.value = []
  } finally {
    suggestionsLoading.value = false
  }
}

// Apply a suggested palette to the current palette
function applySuggestedPalette(palette) {
  // Update the store with the new palette
  store.dispatch('setPalette', {
    ...store.state.palette,
    colors: palette.colors,
    primaryColor: palette.colors[0]
  })
  
  // Update internal selection
  internalSelected.value = palette.colors[0]
  
  // Fetch hues for the new primary color
  fetchAndApplySelectedColor(palette.colors[0])
}

// Pantone color database (subset for demo)
const pantoneDatabase = [
  { name: "Pantone Yellow", number: "012 C", hex: "#FEDD00" },
  { name: "Pantone Warm Red", number: "Warm Red C", hex: "#F9423A" },
  { name: "Pantone Red 032", number: "032 C", hex: "#EF3340" },
  { name: "Pantone Rubine Red", number: "Rubine Red C", hex: "#CE0058" },
  { name: "Pantone Rhodamine Red", number: "Rhodamine Red C", hex: "#E10098" },
  { name: "Pantone Purple", number: "Purple C", hex: "#672A8C" },
  { name: "Pantone Violet", number: "Violet C", hex: "#440099" },
  { name: "Pantone Reflex Blue", number: "Reflex Blue C", hex: "#001489" },
  { name: "Pantone Process Blue", number: "Process Blue C", hex: "#0085CA" },
  { name: "Pantone Green", number: "Green C", hex: "#00AB84" },
  { name: "Pantone Black", number: "Black C", hex: "#2D2926" },
  { name: "Pantone Cool Gray 7", number: "Cool Gray 7 C", hex: "#97999B" },
  { name: "Pantone 186", number: "186 C", hex: "#C8102E" },
  { name: "Pantone 286", number: "286 C", hex: "#0033A0" },
  { name: "Pantone 300", number: "300 C", hex: "#005EB8" },
  { name: "Pantone 325", number: "325 C", hex: "#7BDCB5" },
  { name: "Pantone 7406", number: "7406 C", hex: "#F2A900" },
  { name: "Pantone 7549", number: "7549 C", hex: "#FFB81C" },
  { name: "Pantone 7625", number: "7625 C", hex: "#E35205" },
  { name: "Pantone 7687", number: "7687 C", hex: "#1F3A93" },
  { name: "Pantone 7710", number: "7710 C", hex: "#00A3A1" },
  { name: "Pantone 7732", number: "7732 C", hex: "#1B5E20" },
  { name: "Pantone 877", number: "877 C", hex: "#8A8D8F" }
]

// Convert hex to LAB color space for accurate color comparison
function hexToLab(hex) {
  // First convert to RGB
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  
  // Convert RGB to XYZ
  const toLinear = (c) => c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92
  const rLinear = toLinear(r)
  const gLinear = toLinear(g)
  const bLinear = toLinear(b)
  
  // Observer = 2°, Illuminant = D65
  let x = rLinear * 0.4124564 + gLinear * 0.3575761 + bLinear * 0.1804375
  let y = rLinear * 0.2126729 + gLinear * 0.7151522 + bLinear * 0.0721750
  let z = rLinear * 0.0193339 + gLinear * 0.1191920 + bLinear * 0.9503041
  
  // Normalize for D65 illuminant
  x = x / 0.95047
  y = y / 1.00000
  z = z / 1.08883
  
  // Convert XYZ to LAB
  const fx = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116)
  const fy = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116)
  const fz = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116)
  
  const L = 116 * fy - 16
  const a = 500 * (fx - fy)
  const b_lab = 200 * (fy - fz)
  
  return [L, a, b_lab]
}

// Calculate Delta E (CIE76) between two colors
function calculateDeltaE(lab1, lab2) {
  const deltaL = lab1[0] - lab2[0]
  const deltaA = lab1[1] - lab2[1]
  const deltaB = lab1[2] - lab2[2]
  
  return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB)
}

// Find closest Pantone matches for a given hex color
function findPantoneMatches(targetHex) {
  if (!isValidHex(targetHex)) return []
  
  const targetLab = hexToLab(normalizeHex(targetHex))
  
  const matches = pantoneDatabase.map(pantone => {
    const pantoneLab = hexToLab(pantone.hex)
    const deltaE = calculateDeltaE(targetLab, pantoneLab)
    
    return {
      code: pantone.number,
      name: pantone.name,
      hex: pantone.hex,
      deltaE
    }
  })
  
  // Sort by Delta E (closest first) and return top matches
  return matches.sort((a, b) => a.deltaE - b.deltaE)
}

// Generate Pantone matches for the selected color
async function generatePantoneMatches() {
  if (!selectedColor.value || pantoneLoading.value) return
  
  pantoneLoading.value = true
  try {
    // Simulate async operation for consistency with other API calls
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const matches = findPantoneMatches(selectedColor.value)
    pantoneMatches.value = matches.slice(0, 6) // Top 6 matches
  } catch (error) {
    console.error('[pantone:error]', error)
    pantoneMatches.value = []
  } finally {
    pantoneLoading.value = false
  }
}

// Copy Pantone code to clipboard
function copyPantoneCode(code) {
  navigator.clipboard.writeText(code).then(() => {
    // Show success feedback
    store.dispatch('notifications/addAlert', { 
      message: `Code Pantone copié: ${code}`, 
      type: 'success', 
      duration: 2000 
    })
  }).catch(() => {
    console.warn('Failed to copy Pantone code to clipboard')
  })
}

onMounted(() => {
  if (!internalSelected.value && primaryColors.value?.length) {
    internalSelected.value = primaryColors.value[0]
  }
  // Initial fetch for selected color if palette exists
  if (palette.value?.colors?.length) {
    fetchAndApplySelectedColor(selectedColor.value)
    generateSuggestedPalettes()
    generatePantoneMatches()
  }
})

// When the palette changes (new upload), re-fetch for current selection
watch(() => palette.value?.colors, () => {
  if (palette.value?.colors?.length) {
    fetchAndApplySelectedColor(selectedColor.value)
    generateSuggestedPalettes()
    generatePantoneMatches()
  }
})

// Watch for selected color changes to update suggestions and Pantone matches
watch(selectedColor, () => {
  if (selectedColor.value) {
    generateSuggestedPalettes()
    generatePantoneMatches()
  }
})
</script>

<style scoped>
.container { max-width: 1400px; }

/* Tight Bento Grid Layout with Minimal Spacing */
  .bento-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-auto-rows: 120px;
  grid-auto-flow: dense; /* Organic, irregular placement */
  gap: 0.25rem; /* Reduced from 0.5rem for tighter layout */
  padding: 0; /* Remove inner padding to align left edge exactly */
  box-sizing: border-box;
}

/* Desktop Layout - Optimized for space efficiency */
@media (min-width: 1024px) {
  .bento-grid { gap: 0.375rem; padding: 0; }
  /* Exact desktop placement per provided allocation sketch */
  /* Left column: IMG (top) then PALETTE (tall below) */
  .bento-item.image   { grid-column: 1 / span 3; grid-row: 1 / span 2; }
  .bento-item.palette { grid-column: 1 / span 3; grid-row: 3 / span 4; }
  /* Top center row: COLOR HUE (bar) reduced width */
  .bento-item.hue     { grid-column: 4 / span 6; grid-row: 1 / span 1; }
  /* Center: Suggested palettes directly beneath hue, reduced width */
  .bento-item.suggest { grid-column: 4 / span 6; grid-row: 2 / span 4; }
  /* Right column: PANTONE (tall, shifted lower to avoid overlap) */
  .bento-item.pantone { grid-column: 12 / span 1; grid-row: 2 / span 5; }
}

/* Tablet Layout - Balanced spacing */
@media (min-width: 768px) and (max-width: 1023px) {
  .bento-grid {
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: 0.3rem;
    padding: 0.375rem;
  }
  /* Tablet: stack central items to preserve readability */
  .bento-item.hue     { grid-column: 1 / span 8; grid-row: auto; }
  .bento-item.suggest { grid-column: 1 / span 8; grid-row: auto; }
}

/* Mobile Layout - Minimal spacing for maximum content */
@media (max-width: 767px) {
  .bento-grid {
    grid-template-columns: 1fr;
    gap: 0.25rem;
    padding: 0.25rem;
    grid-auto-rows: 100px; /* Smaller minimum height on mobile */
  }
}

/* Bento Item Base Styles - Optimized for tight layout */
.bento-item {
  min-height: 120px;
  overflow: hidden;
  border-radius: 12px; /* Reduced from default for tighter feel */
  box-sizing: border-box;
}

.bento-item.image { min-height: 240px; }
.bento-item.palette { min-height: 160px; }
  .bento-item.hue { min-height: 180px; max-width: 720px; }
.bento-item.pantone { min-height: 160px; }
.bento-item.suggest { min-height: 160px; }

/* Card Content Optimization - Reduce internal padding */
.bento-item .card, .bento-card {
  height: 100%;
  padding: 0.75rem; /* Reduced from default 1.25rem */
  margin: 0;
  border-radius: 16px; /* match reference rounded corners */
  box-sizing: border-box;
  /* Glass morphism: lighter, more transparent, blurred */
  background: rgba(255,255,255,0.08);
  backdrop-filter: saturate(120%) blur(10px);
  -webkit-backdrop-filter: saturate(120%) blur(10px);
  border: 1px solid rgba(255,255,255,0.14);
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.06) inset,
    0 12px 26px rgba(0,0,0,0.30);
}

/* Mobile Card Adjustments */
@media (max-width: 767px) {
  .bento-item {
    min-height: 100px;
    border-radius: 10px;
  }
  
  .bento-item .card {
    padding: 0.5rem; /* Even tighter on mobile */
    border-radius: 12px;
  }
  
  .bento-item.image { min-height: 140px; grid-column: span 1; grid-row: span 1; }
  .bento-item.palette { min-height: 140px; grid-column: span 1; grid-row: span 1; }
  .bento-item.hue { min-height: 140px; grid-column: span 1; grid-row: span 1; }
  .bento-item.pantone { min-height: 140px; grid-column: span 1; grid-row: span 1; }
  .bento-item.suggest { min-height: 140px; grid-column: span 1; grid-row: span 1; }
}

/* Responsive Typography for Tight Layout */
@media (max-width: 767px) {
  .bento-item h2 {
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }
  
  .bento-item h3 {
    font-size: 0.875rem;
    margin-bottom: 0.375rem;
  }
}

/* Grid Content Optimization */
.bento-item .grid {
  gap: 0.25rem; /* Tighter gaps in internal grids */
}

.bento-item .space-y-3 > * + * {
  margin-top: 0.5rem; /* Reduced vertical spacing */
}

@media (max-width: 767px) {
  .bento-item .space-y-3 > * + * {
    margin-top: 0.375rem; /* Even tighter on mobile */
  }
}

/* Cross-browser Compatibility & Performance Optimizations */
.bento-grid {
  /* Ensure consistent rendering across browsers */
  -webkit-box-sizing: border-box;
  -moz-box-sizing: border-box;
  box-sizing: border-box;
  
  /* Hardware acceleration for smooth scrolling */
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
  
  /* Optimize for performance */
  will-change: transform;
  contain: layout style paint;
}

.bento-item {
  /* Cross-browser box model consistency */
  -webkit-box-sizing: border-box;
  -moz-box-sizing: border-box;
  box-sizing: border-box;
  
  /* Smooth transitions */
  -webkit-transition: all 0.2s ease;
  -moz-transition: all 0.2s ease;
  transition: all 0.2s ease;
  
  /* Prevent content overflow issues */
  overflow: hidden;
  position: relative;
  
  /* Optimize rendering */
  contain: layout style paint;
}

/* Fix bottom spacing issues */
.bento-item:last-child {
  margin-bottom: 0;
}

.bento-grid > .bento-item:last-child {
  margin-bottom: 0;
}

/* Ensure consistent spacing between adjacent elements */
.bento-item + .bento-item {
  margin-top: 0; /* Reset any inherited margins */
}

/* Fix potential flexbox/grid conflicts */
.bento-item > * {
  max-width: 100%;
  box-sizing: border-box;
}

/* Prevent layout shifts during loading */
.bento-item .loading-spinner,
.bento-item .animate-spin {
  min-height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Optimize image rendering */
.bento-item img {
  max-width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
}

/* Square Pantone sample positioned above the card */
.pantone-sample {
  width: 100%;
  aspect-ratio: 1 / 1; /* Keep natural square proportions */
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.14);
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.06) inset,
    0 10px 22px rgba(0,0,0,0.28);
  margin-bottom: 0.5rem; /* Space above Pantone elements */
}

/* Enhanced mobile optimizations */
@media (max-width: 767px) {
  .bento-grid {
    /* Prevent horizontal scrolling on mobile */
    max-width: 100vw;
    overflow-x: hidden;
  }
  
  .bento-item {
    /* Ensure touch-friendly interactions */
    min-height: 44px; /* iOS minimum touch target */
  }
}

/* High DPI display optimizations */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .bento-item {
    /* Crisp borders on retina displays */
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
  }
}
</style>

/* Pantone Card (overlay text on swatch, resemblance below) */
.pantone-card {
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
  border: 1px solid rgba(255,255,255,0.12);
  box-shadow:
    0 0 0 1px rgba(0,0,0,0.06) inset,
    0 12px 26px rgba(0,0,0,0.3);
}

.pantone-swatch {
  position: relative;
  min-height: 180px;
}

/* Footer strip to match Pantone card reference */
.pantone-footer {
  background: #fff;
  color: #111;
  padding: 1rem 1rem 0.75rem 1rem;
}
.pantone-footer-brand {
  font-weight: 800;
  letter-spacing: 0.02em;
  font-size: 1.1rem;
}
.pantone-footer-name {
  font-size: 1rem;
  margin-top: 0.25rem;
}
.pantone-footer-code {
  font-size: 0.85rem;
  color: rgba(0,0,0,0.7);
}

.pantone-meta {
  background: #fff;
  padding: 0.75rem 1rem;
}
.pantone-resemblance { font-size: 0.9rem; color: rgba(0,0,0,0.8); }
