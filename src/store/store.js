import { reactive, readonly, computed } from 'vue'

// Create a simple reactive state
const state = reactive({
  // App state
  appName: 'De-Colorize',
  isDarkMode: true,
  version: '1.0.0',
  
  // Colors state
  colors: [],
  selectedColor: null,
  searchTerm: '',
  sortOptions: {
    sortBy: 'date',
    sortDirection: 'asc'
  },
  colorHistory: []
})

// Getters as computed properties
const getters = {
  // App getters
  appName: computed(() => state.appName),
  isDarkMode: computed(() => state.isDarkMode),
  appVersion: computed(() => state.version),
  
  // Colors getters
  allColors: computed(() => state.colors),
  selectedColor: computed(() => state.selectedColor),
  colorCount: computed(() => state.colors.length),
  colorHistory: computed(() => state.colorHistory),
  
  // Filtered and sorted colors
  filteredColors: computed(() => {
    let result = [...state.colors]
    
    // Apply search filter
    if (state.searchTerm) {
      const searchLower = state.searchTerm.toLowerCase()
      result = result.filter(color => 
        color.name.toLowerCase().includes(searchLower) || 
        color.value.toLowerCase().includes(searchLower)
      )
    }
    
    // Apply sorting
    const { sortBy, sortDirection } = state.sortOptions
    result.sort((a, b) => {
      let comparison = 0
      
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else if (sortBy === 'date') {
        comparison = a.timestamp - b.timestamp
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })
    
    return result
  })
}

// Actions to modify state
const actions = {
  // App actions
  toggleDarkMode() {
    state.isDarkMode = !state.isDarkMode
  },
  
  setAppName(name) {
    state.appName = name
  },
  
  // Color actions
  addColor(color) {
    const newColor = {
      id: Date.now().toString(),
      name: color.name,
      value: color.value,
      timestamp: Date.now()
    }
    
    state.colors.push(newColor)
    
    // Add to history
    state.colorHistory.unshift({
      type: 'add',
      color: newColor,
      timestamp: Date.now()
    })
  },
  
  removeColor(id) {
    const colorToRemove = state.colors.find(c => c.id === id)
    if (colorToRemove) {
      state.colors = state.colors.filter(c => c.id !== id)
      
      // Add to history
      state.colorHistory.unshift({
        type: 'remove',
        color: colorToRemove,
        timestamp: Date.now()
      })
      
      // Clear selection if removed
      if (state.selectedColor && state.selectedColor.id === id) {
        state.selectedColor = null
      }
    }
  },
  
  selectColor(color) {
    state.selectedColor = color
  },
  
  clearColors() {
    state.colors = []
    state.selectedColor = null
    
    // Add to history
    state.colorHistory.unshift({
      type: 'clear',
      timestamp: Date.now()
    })
  },
  
  setSearchTerm(term) {
    state.searchTerm = term
  },
  
  setSortOptions(options) {
    state.sortOptions = { ...state.sortOptions, ...options }
  }
}

// Create a store with readonly state and getters
const store = {
  state: readonly(state),
  getters,
  dispatch: (actionName, payload) => {
    if (typeof actions[actionName] === 'function') {
      return actions[actionName](payload)
    } else {
      console.error(`Action "${actionName}" not found`)
    }
  }
}

// Create a Vue composable to use the store
export function useStore() {
  return store
}

// Export the store instance
export default store