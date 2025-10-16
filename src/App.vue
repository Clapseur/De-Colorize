<script setup>
import logo from '../src/assets/pipette.png'
import Header from '../src/components/Header.vue';

const items = [
  {
    label: "About",
    bgColor: "#0D0716",
    textColor: "#fff",
    links: [
      { label: "Company", ariaLabel: "About Company" },
      { label: "Careers", ariaLabel: "About Careers" }
    ]
  },
  {
    label: "Projects",
    bgColor: "#170D27",
    textColor: "#fff",
    links: [
      { label: "Featured", ariaLabel: "Featured Projects" },
      { label: "Case Studies", ariaLabel: "Project Case Studies" }
    ]
  },
  {
    label: "Contact",
    bgColor: "#271E37",
    textColor: "#fff",
    links: [
      { label: "Email", ariaLabel: "Email us" },
      { label: "Twitter", ariaLabel: "Twitter" },
      { label: "LinkedIn", ariaLabel: "LinkedIn" }
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
  />
  <div class="min-h-screen w-full" :class="{ 'dark bg-gray-900 text-white': isDarkMode }">
    <header class="margin:  auto;">
      <h1 class="text-4xl font-bold">De-Colorizer</h1>
    </header>
    
    <main class="container mx-auto px-4">
      <div class="mt-6">
      </div>
    </main>
  </div>
</template>
<script>

</script>