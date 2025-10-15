<template>
  <div class="color-component">
    <h2>Color Manager</h2>
    
    <div class="color-input">
      <input 
        type="color" 
        v-model="newColor" 
        class="color-picker"
      />
      <input 
        type="text" 
        v-model="colorName" 
        placeholder="Color name" 
        class="color-name"
      />
      <button @click="addNewColor" class="add-btn">Add Color</button>
    </div>
    
    <div class="search-sort">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchTerm" 
          @input="updateSearch"
          placeholder="Search colors..." 
          class="search-input"
        />
      </div>
      <div class="sort-options">
        <span>Sort by:</span>
        <button @click="sortColors('name')" class="sort-btn">Name</button>
        <button @click="sortColors('date')" class="sort-btn">Date</button>
      </div>
    </div>
    
    <div class="color-list">
      <div 
        v-for="color in colors" 
        :key="color.id" 
        class="color-item"
        :style="{ borderColor: color.value }"
        @click="selectColor(color)"
      >
        <div class="color-preview" :style="{ backgroundColor: color.value }"></div>
        <div class="color-details">
          <span class="color-name">{{ color.name }}</span>
          <span class="color-value">{{ color.value }}</span>
        </div>
        <button @click.stop="removeColor(color.id)" class="remove-btn">×</button>
      </div>
    </div>
    
    <div v-if="selectedColor" class="selected-color">
      <h3>Selected Color</h3>
      <div class="color-preview large" :style="{ backgroundColor: selectedColor.value }"></div>
      <div class="color-info">
        <p>Name: {{ selectedColor.name }}</p>
        <p>Value: {{ selectedColor.value }}</p>
      </div>
    </div>
    
    <button @click="toggleDarkMode" class="theme-toggle">Toggle Dark Mode</button>
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
    
    // Get colors from store
    const colors = computed(() => store.getters['colors/filteredColors'])
    const selectedColor = computed(() => store.getters['colors/selectedColor'])
    
    // Add a new color
    const addNewColor = () => {
      if (colorName.value.trim() === '') {
        alert('Please enter a color name')
        return
      }
      
      store.dispatch('colors/addColor', {
        name: colorName.value,
        value: newColor.value
      })
      
      // Reset inputs
      colorName.value = ''
    }
    
    // Search colors
    const updateSearch = () => {
      store.dispatch('colors/setSearchTerm', searchTerm.value)
    }
    
    // Sort colors
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

<style scoped>
.color-component {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.color-input {
  display: flex;
  margin-bottom: 20px;
  gap: 10px;
}

.color-picker {
  width: 50px;
  height: 40px;
  padding: 0;
  border: none;
  cursor: pointer;
}

.color-name {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.add-btn {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.add-btn:hover {
  background-color: #45a049;
}

.search-sort {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  align-items: center;
}

.search-box {
  flex: 1;
  margin-right: 15px;
}

.search-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.sort-options {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sort-btn {
  padding: 6px 12px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.sort-btn:hover {
  background-color: #e0e0e0;
}

.color-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.color-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border: 2px solid transparent;
  border-radius: 6px;
  background-color: #f9f9f9;
  cursor: pointer;
  position: relative;
}

.color-item:hover {
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.color-preview {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  margin-right: 10px;
}

.color-preview.large {
  width: 100px;
  height: 100px;
  margin: 0 auto 20px;
}

.color-details {
  flex: 1;
}

.color-name {
  display: block;
  font-weight: bold;
}

.color-value {
  display: block;
  font-size: 0.8em;
  color: #666;
}

.remove-btn {
  background: none;
  border: none;
  color: #ff5252;
  font-size: 18px;
  cursor: pointer;
  position: absolute;
  top: 5px;
  right: 5px;
}

.selected-color {
  background-color: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 20px;
}

.color-info {
  text-align: left;
  max-width: 300px;
  margin: 0 auto;
}

.theme-toggle {
  display: block;
  margin: 0 auto;
  padding: 10px 20px;
  background-color: #6200ea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.theme-toggle:hover {
  background-color: #5000d6;
}
</style>