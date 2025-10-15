<template>
  <div class="explore-component">
    <h2>Color Explorer</h2>
    
    <div class="history-section">
      <h3>Color History</h3>
      <div class="history-list">
        <div v-for="(entry, index) in history" :key="index" class="history-item">
          <span class="timestamp">{{ formatTime(entry.timestamp) }}</span>
          <span class="action">
            <template v-if="entry.type === 'add'">
              Added <span class="color-name">{{ entry.color.name }}</span>
              <span 
                class="color-dot" 
                :style="{ backgroundColor: entry.color.value }"
              ></span>
            </template>
            <template v-else-if="entry.type === 'remove'">
              Removed <span class="color-name">{{ entry.color.name }}</span>
            </template>
            <template v-else-if="entry.type === 'clear'">
              Cleared all colors
            </template>
          </span>
        </div>
      </div>
    </div>
    
    <div class="stats-section">
      <h3>Color Statistics</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">{{ totalColors }}</div>
          <div class="stat-label">Total Colors</div>
        </div>
        <div class="stat-item" v-if="selectedColor">
          <div class="stat-value">Selected</div>
          <div class="stat-label">
            {{ selectedColor.name }}
            <span 
              class="color-dot" 
              :style="{ backgroundColor: selectedColor.value }"
            ></span>
          </div>
        </div>
      </div>
    </div>
    
    <button @click="clearAllColors" class="clear-btn">Clear All Colors</button>
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

<style scoped>
.explore-component {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.history-section, .stats-section {
  margin-bottom: 30px;
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 15px;
}

.history-list {
  max-height: 300px;
  overflow-y: auto;
}

.history-item {
  padding: 10px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
}

.timestamp {
  color: #888;
  font-size: 0.8em;
  margin-right: 10px;
  min-width: 70px;
}

.color-name {
  font-weight: bold;
}

.color-dot {
  display: inline-block;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  margin-left: 5px;
  vertical-align: middle;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
}

.stat-item {
  background-color: white;
  padding: 15px;
  border-radius: 6px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.stat-value {
  font-size: 1.5em;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  color: #666;
}

.clear-btn {
  padding: 10px 20px;
  background-color: #ff5252;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.clear-btn:hover {
  background-color: #ff3838;
}
</style>