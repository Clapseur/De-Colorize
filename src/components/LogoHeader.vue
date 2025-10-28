<template>
  <div class="fixed top-0 left-0 right-0 z-[55] pointer-events-none">
    <div class="container mx-auto px-4 pt-4 sm:pt-5">
      <div class="flex items-center justify-center">
        <router-link to="/" class="pointer-events-auto inline-flex items-center">
          <img :src="fullLogo" alt="Decolorizer" class="h-8 sm:h-9 w-auto" />
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import fullLogo from '../assets/full.png'
</script>

<style scoped>
/* Ensure proper responsive alignment and spacing */
</style>
