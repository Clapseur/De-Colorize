<script setup>
import logo from '../assets/full.png'
import Dropzone from './Dropzone.vue'
</script>

<template class="bg-gray-900 text-white">
  <div class="flex flex-col justify-center items-center h-screen">
    <img :src="logo" class="max-w-[700px]" alt="Pipette" />
    <Dropzone class="max-w-xl w-full"/>
  </div>
</template>

