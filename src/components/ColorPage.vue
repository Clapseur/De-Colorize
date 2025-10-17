<template>
  <div class="max-w-xl mx-auto p-5">
    <h2 class="text-2xl font-bold mb-6">Color Manager</h2>
    
    <div class="flex mb-5 gap-2.5">
      <input 
        type="color" 
        v-model="newColor" 
        class="w-12 h-10 p-0 border-none cursor-pointer"
      />
      <input 
        type="text" 
        v-model="colorName" 
        placeholder="Color name" 
        class="flex-1 p-2 border border-gray-300 rounded"
      />
      <button @click="addNewColor" class="px-4 py-2 bg-green-600 text-white border-none rounded hover:bg-green-700">Add Color</button>
    </div>
    
    <div class="flex justify-between mb-5 items-center">
      <div class="flex-1 mr-4">
        <input 
          type="text" 
          v-model="searchTerm" 
          @input="updateSearch"
          placeholder="Search colors..." 
          class="w-full p-2 border border-gray-300 rounded"
        />
      </div>
      <div class="flex items-center gap-2">
        <span>Sort by:</span>
        <button @click="sortColors('name')" class="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200">Name</button>
        <button @click="sortColors('date')" class="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200">Date</button>
      </div>
    </div>
    
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
      <div 
        v-for="color in colors" 
        :key="color.id" 
        class="flex items-center p-2.5 border-2 rounded-md bg-gray-50 cursor-pointer relative hover:shadow-md"
        :style="{ borderColor: color.value }"
        @click="selectColor(color)"
      >
        <div class="w-8 h-8 rounded-full mr-2.5" :style="{ backgroundColor: color.value }"></div>
        <div class="flex-1">
          <span class="block font-bold">{{ color.name }}</span>
          <span class="block text-sm text-gray-600">{{ color.value }}</span>
        </div>
        <button @click.stop="removeColor(color.id)" class="bg-transparent border-none text-red-500 text-xl cursor-pointer absolute top-1 right-1">×</button>
      </div>
    </div>
    
    <div v-if="selectedColor" class="bg-gray-100 p-5 rounded-lg text-center mb-5">
      <h3 class="text-xl font-semibold mb-3">Selected Color</h3>
      <div class="w-24 h-24 rounded-full mx-auto mb-5" :style="{ backgroundColor: selectedColor.value }"></div>
      <div class="text-left max-w-xs mx-auto">
        <p class="mb-1">Name: {{ selectedColor.name }}</p>
        <p>Value: {{ selectedColor.value }}</p>
      </div>
    </div>
    
    <button @click="toggleDarkMode" class="block mx-auto px-5 py-2.5 bg-purple-700 text-white border-none rounded font-bold hover:bg-purple-800">Toggle Dark Mode</button>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useStore } from '../store/store'

export default {
  name: 'ColorComponent',
  
  setup() {
    const store = useStore()
    const newColor = ref('#ff0000')
    const colorName = ref('')
    const searchTerm = ref('')
    
    const colors = computed(() => store.getters['colors/filteredColors'])
    const selectedColor = computed(() => store.getters['colors/selectedColor'])
    
    const addNewColor = () => {
      if (colorName.value.trim() === '') {
        alert('Please enter a color name')
        return
      }
      
      store.dispatch('colors/addColor', {
        name: colorName.value,
        value: newColor.value
      })
      
      colorName.value = ''
    }
    
    const updateSearch = () => {
      store.dispatch('colors/setSearchTerm', searchTerm.value)
    }
    
    const sortColors = (sortBy) => {
      store.dispatch('colors/setSortOptions', { 
        sortBy, 
        sortDirection: 'asc' 
      })
    }
    
    return {
      newColor,
      colorName,
      searchTerm,
      colors,
      selectedColor,
      addNewColor,
      updateSearch,
      sortColors,
      selectColor: (color) => store.dispatch('colors/selectColor', color),
      removeColor: (id) => store.dispatch('colors/removeColor', id),
      toggleDarkMode: () => store.dispatch('toggleDarkMode')
    }
  }
}
</script>