<script setup>
 import logo from './assets/full.png'
import Header from './components/Header.vue';
import { useStore } from './store/store'

const store = useStore()
const isDarkMode = store.getters.isDarkMode

const items = [
  {
    label: "Pages",
    bgColor: "#0D0716",
    textColor: "#fff",
    links: [
      { label: "Home", ariaLabel: "Go to Home", href: "/" }
    ]
  },
  {
    label: "Tools",
    bgColor: "#170D27",
    textColor: "#fff",
    links: [
      { label: "Colors", ariaLabel: "Manage Colors", href: "/colors" },
      { label: "Palette", ariaLabel: "Color Palette", href: "/palette" },
      { label: "Hue", ariaLabel: "Color Hue", href: "/hue" }
    ]
  },
  {
    label: "Explore",
    bgColor: "#271E37",
    textColor: "#fff",
    links: [
      { label: "Explore", ariaLabel: "Explore Colors", href: "/explore" }
    ]
  }
];
</script>
<template>
    <Header
    :logo="logo"
    logoAlt="Company Logo"
    :items="items"
    baseColor="#fff"
    menuColor="#000"
    buttonBgColor="#111"
    buttonTextColor="#fff"
    ease="power3.out"
    :underlayColors="['#9EF2B2', '#27FF64']"
    openMenuButtonColor="#27FF64"
    changeMenuColorOnOpen
  />
  <div class="min-h-screen w-full" :class="{ 'dark bg-gray-900 text-white': isDarkMode }">
    <main class="container mx-auto px-4">
      <router-view />
    </main>
  </div>
</template>
<script>

</script>