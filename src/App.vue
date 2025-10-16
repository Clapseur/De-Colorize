<script setup>
import Color from './components/ColorPage.vue'
import Explore from './components/ExplorePage.vue'
</script>

<template>
  <div class="min-h-screen w-full" :class="{ 'dark bg-gray-900 text-white': isDarkMode }">
    <header class="py-6 ">
      <h1 class="text-4xl font-bold text-center">Color Manager App</h1>
    </header>
    
    <main class="container mx-auto px-4">
      <div class="flex justify-center space-x-4 mb-6">
        <button 
          @click="activeTab = 'color'" 
          class="btn px-4 py-2 rounded-md"
          :class="{ 'bg-blue-600 text-white': activeTab === 'color', 'bg-gray-200 text-gray-800': activeTab !== 'color' }"
        >
          Color Manager
        </button>
        <button 
          @click="activeTab = 'explore'" 
          class="btn px-4 py-2 rounded-md"
          :class="{ 'bg-blue-600 text-white': activeTab === 'explore', 'bg-gray-200 text-gray-800': activeTab !== 'explore' }"
        >
          Explore
        </button>
      </div>
      
      <div class="mt-6">
        <Color v-if="activeTab === 'color'" />
        <Explore v-if="activeTab === 'explore'" />
      </div>
    </main>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useStore } from './store/store'

export default {
  setup() {
    const store = useStore()
    const activeTab = ref('color')
    
    return {
      activeTab,
      isDarkMode: computed(() => store.getters.isDarkMode)
    }
  }
}
</script>