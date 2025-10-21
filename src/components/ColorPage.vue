<template>
  <div class="container mx-auto p-4 text-white mt-4">
    <h1 class="text-2xl font-semibold mb-4">Color Palette</h1>

    <MagicBento
      :use-slot="true"
      :enable-spotlight="true"
      :enable-stars="false"
      :enable-border-glow="true"
      :disable-animations="false"
      :spotlight-radius="260"
      glow-color="77, 254, 6"
      :enable-tilt="false"
      :click-effect="true"
      :enable-magnetism="true"
    >
      <!-- Custom Bento Grid matching provided sketch -->
      <div class="bento-grid">
        <!-- IMAGE (top-left) -->
        <div class="bento-item image">
          <div class="card card--border-glow bg-white/5 rounded-[20px] border border-white/10 p-5">
            <h2 class="text-sm font-medium mb-3">Image</h2>
            <div class="w-full bg-black/20 rounded-xl overflow-hidden border border-white/10">
              <img
                v-if="palette?.imageSrc"
                :src="palette.imageSrc"
                alt="Uploaded"
                class="object-contain w-full max-h-[280px]"
              />
              <div v-else class="p-6 text-sm text-white/70">No image available.</div>
            </div>
          </div>
        </div>

        <!-- PALETTE (below image) -->
        <div class="bento-item palette">
          <div class="card card--border-glow bg-white/5 rounded-[20px] border border-white/10 p-5">
            <h2 class="text-sm font-medium mb-3">Palette</h2>
            <div class="grid grid-cols-5 gap-3">
              <button
                v-for="(c, idx) in primaryColors"
                :key="idx"
                class="relative h-12 rounded-lg border border-white/15 focus:outline-none"
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
          <div class="card card--border-glow bg-white/5 rounded-[20px] border border-white/10 p-5">
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
          <div class="card card--border-glow bg-white/5 rounded-[20px] border border-white/10 p-5">
            <h2 class="text-lg font-medium mb-2">Design System</h2>
            <p class="text-sm text-white/70">Reserved for tokens, type scale, spacing, and components.</p>
          </div>
        </div>

        <!-- PANTONE EQUIVALENT (tall right column) -->
        <div class="bento-item pantone">
          <div class="card card--border-glow bg-white/5 rounded-[20px] border border-white/10 p-5">
            <h2 class="text-lg font-medium mb-2">Pantone Equivalent</h2>
            <p class="text-sm text-white/70">Nearest Pantone matches will appear here.</p>
          </div>
        </div>

        <!-- SUGGESTED PALETTES (bottom wide) -->
        <div class="bento-item suggest">
          <div class="card card--border-glow bg-white/5 rounded-[20px] border border-white/10 p-5">
            <h2 class="text-lg font-medium mb-2">Suggested Palettes</h2>
            <p class="text-sm text-white/70">Suggestions based on image or selected base color.</p>
          </div>
        </div>
      </div>
    </MagicBento>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import MagicBento from './MagicBento/MagicBento.vue'
import { useStore } from '../store/store.js'

const store = useStore()

const palette = computed(() => store.state.palette)
const primaryColors = computed(() => palette.value?.colors || [])

const internalSelected = ref(null)
const selectedColor = computed(() => internalSelected.value || palette.value?.primaryColor || primaryColors.value[0] || '#000000')

function selectColor(c) {
  internalSelected.value = c
}

function copySelectedColor() {
  navigator.clipboard.writeText(selectedColor.value)
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)) }

function hexToRgb(hex) {
  const m = hex.replace('#','')
  const bigint = parseInt(m.length === 3 ? m.split('').map(x=>x+x).join('') : m, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return { r, g, b }
}

function rgbToHex({ r, g, b }) {
  const toHex = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function blendWithFactor(hex, factor) {
  const { r, g, b } = hexToRgb(hex)
  const rr = clamp(r * factor + 255 * (1 - factor), 0, 255)
  const gg = clamp(g * factor + 255 * (1 - factor), 0, 255)
  const bb = clamp(b * factor + 255 * (1 - factor), 0, 255)
  return rgbToHex({ r: rr, g: gg, b: bb })
}

function computeTenVariations(base) {
  const steps = Array.from({ length: 10 }, (_, i) => i)
  const factors = steps.map((i) => clamp((i + 1) / 10, 0.05, 1))
  return factors.map((f) => blendWithFactor(base, f))
}

const selectedVariations = computed(() => computeTenVariations(selectedColor.value))

onMounted(() => {
  if (!internalSelected.value && primaryColors.value?.length) {
    internalSelected.value = primaryColors.value[0]
  }
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