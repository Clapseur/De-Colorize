<template>
  <div class="max-w-xl mx-auto p-5">
    <h2 class="text-2xl font-bold mb-6">Color Explorer</h2>
    
    <div class="mb-8 bg-gray-50 rounded-lg p-4">
      <h3 class="text-xl font-semibold mb-3">Color History</h3>
      <div class="max-h-[300px] overflow-y-auto">
        <div v-for="(entry, index) in history" :key="index" class="py-2.5 border-b border-gray-200 flex items-center">
          <span class="text-gray-500 text-sm mr-2.5 min-w-[70px]">{{ formatTime(entry.timestamp) }}</span>
          <span>
            <template v-if="entry.type === 'add'">
              Added <span class="font-bold">{{ entry.color.name }}</span>
              <span 
                class="inline-block w-4 h-4 rounded-full ml-1 align-middle" 
                :style="{ backgroundColor: entry.color.value }"
              ></span>
            </template>
            <template v-else-if="entry.type === 'remove'">
              Removed <span class="font-bold">{{ entry.color.name }}</span>
            </template>
            <template v-else-if="entry.type === 'clear'">
              Cleared all colors
            </template>
          </span>
        </div>
      </div>
    </div>
    
    <div class="mb-8 bg-gray-50 rounded-lg p-4">
      <h3 class="text-xl font-semibold mb-3">Color Statistics</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="bg-white p-4 rounded-md text-center shadow-sm">
          <div class="text-2xl font-bold mb-1">{{ totalColors }}</div>
          <div class="text-gray-600">Total Colors</div>
        </div>
        <div class="bg-white p-4 rounded-md text-center shadow-sm" v-if="selectedColor">
          <div class="text-2xl font-bold mb-1">Selected</div>
          <div class="text-gray-600">
            {{ selectedColor.name }}
            <span 
              class="inline-block w-4 h-4 rounded-full ml-1 align-middle" 
              :style="{ backgroundColor: selectedColor.value }"
            ></span>
          </div>
        </div>
      </div>
    </div>
    
    <button @click="clearAllColors" class="px-5 py-2.5 bg-red-500 text-white border-none rounded font-bold hover:bg-red-600">Clear All Colors</button>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from '../store/store'

export default {
  name: 'ExploreComponent',
  
  setup() {
    const store = useStore()
    
    // Get data from store
    const colors = computed(() => store.getters['colors/allColors'])
    const selectedColor = computed(() => store.getters['colors/selectedColor'])
    const history = computed(() => store.getters['colors/colorHistory'])
    
    // Computed properties
    const totalColors = computed(() => store.getters['colors/colorCount'])
    
    // Format timestamp
    const formatTime = (timestamp) => {
      const date = new Date(timestamp)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    
    return {
      colors,
      selectedColor,
      history,
      totalColors,
      formatTime,
      clearAllColors: () => store.dispatch('colors/clearColors')
    }
  }
}
</script>