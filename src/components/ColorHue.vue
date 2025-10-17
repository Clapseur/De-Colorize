<template>
  <section class="container mx-auto px-4 py-12 text-white">
    <!-- Controls -->
    <div class="mx-auto max-w-xl p-6 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-xl shadow-lg">
      <h2 class="text-2xl font-semibold mb-4">Hue Explorer</h2>
      <div class="flex items-center gap-3">
        <input
          v-model="hexInput"
          type="text"
          placeholder="#c7d92c"
          class="flex-1 px-4 py-2 rounded-full bg-transparent border border-white/40 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
          @blur="normalizeHex"
        />
        <button @click="normalizeHex" class="px-4 py-2 rounded-full bg-white/15 border border-white/30 backdrop-blur hover:bg-white/25 transition">
          Apply
        </button>
      </div>
      <p v-if="!isValidHex" class="mt-2 text-sm text-red-300">Enter a valid 3 or 6-digit hex.</p>
    </div>

    <!-- Palette -->
    <div class="mt-8 grid grid-cols-2 sm:grid-cols-5 gap-4">
      <div
        v-for="(c, i) in palette"
        :key="i"
        class="rounded-2xl p-4 border border-white/20 shadow-lg"
        :style="{ backgroundColor: c }"
      >
        <div class="flex items-center justify-between text-xs">
          <span class="bg-black/30 text-white px-2 py-0.5 rounded-full">{{ c.toUpperCase() }}</span>
          <span class="bg-white/20 text-white px-2 py-0.5 rounded-full">#{{ i + 1 }}</span>
        </div>
      </div>
    </div>
  </section>
</template>
<script setup>
import { ref, computed } from 'vue'

const hexInput = ref('#c7d92c')

const isValidHex = computed(() => {
  const h = hexInput.value.trim()
  return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(h)
})

function normalizeHex() {
  let h = hexInput.value.trim()
  if (!h) return
  if (!h.startsWith('#')) h = `#${h}`
  hexInput.value = h
}

function hexToRgb(hex) {
  hex = hex.replace('#', '')
  if (hex.length === 3) {
    hex = hex.split('').map(ch => ch + ch).join('')
  }
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return { r, g, b }
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s
  const l = (max + min) / 2
  if (max === min) {
    h = 0; s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h *= 60
  }
  return { h, s, l }
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r1, g1, b1
  if (0 <= h && h < 60) { r1 = c; g1 = x; b1 = 0 }
  else if (60 <= h && h < 120) { r1 = x; g1 = c; b1 = 0 }
  else if (120 <= h && h < 180) { r1 = 0; g1 = c; b1 = x }
  else if (180 <= h && h < 240) { r1 = 0; g1 = x; b1 = c }
  else if (240 <= h && h < 300) { r1 = x; g1 = 0; b1 = c }
  else { r1 = c; g1 = 0; b1 = x }
  const r = Math.round((r1 + m) * 255)
  const g = Math.round((g1 + m) * 255)
  const b = Math.round((b1 + m) * 255)
  return { r, g, b }
}

function rgbToHex(r, g, b) {
  const toHex = v => v.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

const palette = computed(() => {
  if (!isValidHex.value) return []
  const { r, g, b } = hexToRgb(hexInput.value)
  const base = rgbToHsl(r, g, b)
  const colors = []
  const step = 36 // 360 / 10
  for (let i = 0; i < 10; i++) {
    const nh = (base.h + i * step) % 360
    const { r: rr, g: gg, b: bb } = hslToRgb(nh, base.s, base.l)
    colors.push(rgbToHex(rr, gg, bb))
  }
  return colors
})
</script>
