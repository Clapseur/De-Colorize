<style>
#app{
  background-color: #121212;
}
</style>
<template>
  <div id="app">
    <div class="fixed inset-0 z-50 pointer-events-none">
      <StaggeredMenu
        :items="menuItems"
        :colors="['#121212', '#242424']"
        :logoUrl="logo"
        accentColor="#121212"
        position="right"
        menuButtonColor="#fff"
        openMenuButtonColor="#000"
        changeMenuColorOnOpen
      />
    </div>
    <div class="relative min-h-screen w-full" :class="{ 'text-white': isDarkMode }">
      <!-- Header alerts -->
      <div class="fixed top-0 left-0 right-0 z-[60] px-4 py-2 space-y-2">
        <div
          v-for="a in alerts"
          :key="a.id"
          class="flex items-center justify-between px-4 py-2 rounded shadow-md"
          :class="{
            'bg-red-600 text-white': a.type === 'error',
            'bg-green-600 text-white': a.type === 'success'
          }"
        >
          <span class="font-semibold">{{ a.message }}</span>
          <button
            class="px-2 py-1 rounded bg-black/20 hover:bg-black/30"
            @click="removeAlert(a.id)"
          >
            ×
          </button>
        </div>
      </div>

      <div class="absolute inset-0 z-0 pointer-events-none">
        <Prism
      animation-type="rotate"
      :time-scale="0.5"
      :height="3.5"
      :base-width="5.5"
      :scale="3.6"
      :hue-shift="0"
      :color-frequency="1"
      :noise="0"
      :glow="1"
    />
      </div>
      <main class="relative z-10 container mx-auto px-4 pt-16">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import logo from './assets/pipette.png'
import StaggeredMenu from './components/StaggeredMenu/StaggeredMenu.vue'
import Prism from './components/Prism/Prism.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from './store/store'

const route = useRoute()
const isHome = computed(() => route.name === 'home')

const store = useStore()
const isDarkMode = computed(() => store.state.isDarkMode)

const alerts = computed(() => store.state.notifications.alerts)
const removeAlert = (id) => store.dispatch('notifications/removeAlert', id)

const menuItems = [
  { label: 'Home', ariaLabel: 'Go to Home', link: '/' },
  { label: 'Hue', ariaLabel: 'Color Hue', link: '/hue' },
  { label: 'Explore', ariaLabel: 'Explore Colors', link: '/explore' },
  { label: 'Color', ariaLabel: 'Color Page', link: '/color' }
]
</script>