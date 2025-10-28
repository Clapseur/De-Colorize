<style>
#app{
  background-color: #121212;

}
</style>
<template>
  <div id="app">
    <div class="fixed inset-0 z-50 pointer-events-none h-full">
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
    <Squares 
      direction="diagonal"
      :speed="0.7"
      :squareSize="45"
      borderColor="#999"
      :hoverFillColor="store.state.selectedColor || '#121212'"
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
import Squares from './components/BG/Squares.vue'
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
  { label: 'Accueil', ariaLabel: 'Retour a l\'accueil', link: '/' },
  { label: 'Dégradé', ariaLabel: 'Color Hue', link: '/hue' },
  { label: 'Palettes', ariaLabel: 'Color Page', link: '/color' },
  { label: 'Explore', ariaLabel: 'Explore Colors', link: '/explore' },
  { label: 'IA', ariaLabel: 'Utilisez l\'IA pour générer des dégradés', link: '/ai' }
]
</script>