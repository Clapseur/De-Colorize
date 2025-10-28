<style>
#app{
  background-color: #121212;
}
/* Hide StaggeredMenu's built-in left logo on non-home pages */
.no-sm-logo .staggered-menu-header .sm-logo-img{ display: none !important; }
</style>
<template>
  <div id="app">
    <div class="fixed inset-0 z-50 pointer-events-none h-full">
      <!--
        Header logo deduplication note:
        We only render the brand logo via StaggeredMenu's header (position="right").
        No separate left/inline header logo is mounted anywhere else.
        This prevents the left logo from reappearing/regenerating on AI view or route changes.
      -->
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
      <!-- Centered header brand shown on non-home pages -->
      <LogoHeader v-if="!isHome" />
    </div>
    <div class="relative min-h-screen w-full" :class="{ 'text-white': isDarkMode, 'no-sm-logo': !isHome }">
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
          <span class="px-2 py-1 rounded bg-black/20">×</span>
        </div>
      </div>

      <div class="absolute inset-0 z-0 pointer-events-none">
    <Squares 
      direction="diagonal"
      :speed="0.7"
      :squareSize="40"
      borderColor="#999"

    />
      </div>
      <main class="relative z-10 container mx-auto px-4 pt-16">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import StaggeredMenu from './components/StaggeredMenu/StaggeredMenu.vue'
import Squares from './components/BG/Squares.vue'
import LogoHeader from './components/LogoHeader.vue'
import logo from './assets/pipette.png'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from './store/store'
// FR note: on bloque l'accès aux palettes tant qu'il n'y a pas d'image uploadée

const route = useRoute()
const isHome = computed(() => route.name === 'home')

const store = useStore()
const isDarkMode = computed(() => store.state.isDarkMode)
const hasImage = computed(() => !!store.state.palette.imageUrl)

const alerts = computed(() => store.state.notifications.alerts)

const menuItems = computed(() => [
  { label: 'Accueil', ariaLabel: 'Retour à l\'accueil', link: '/' },
  { label: 'Dégradé', ariaLabel: 'Color Hue', link: '/hue' },
  { label: 'Palettes', ariaLabel: 'Color Page', link: '/color', disabled: !hasImage.value, lockMsg: 'Télécharge une image d\'abord ✨' },
  { label: 'Explore', ariaLabel: 'Explore Colors', link: '/explore' },
  { label: 'IA', ariaLabel: 'Utilisez l\'IA pour générer des dégradés', link: '/ai' }
])
</script>
