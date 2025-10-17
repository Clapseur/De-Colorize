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
      <main class="relative z-10 container mx-auto px-4">
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
import AnimatedContainer from './components/Animations/AnimatedContainer.vue'

const route = useRoute()
const isHome = computed(() => route.name === 'home')

const store = useStore()
const isDarkMode = computed(() => store.state.isDarkMode)

const menuItems = [
  { label: 'Home', ariaLabel: 'Go to Home', link: '/' },
  { label: 'Hue', ariaLabel: 'Color Hue', link: '/hue' },
  { label: 'Explore', ariaLabel: 'Explore Colors', link: '/explore' }
]
</script>