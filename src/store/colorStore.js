// Color store module
export default {
  state: {
    colors: [],
    selectedColor: null,
    history: [],
    filters: {
      searchTerm: '',
      sortBy: 'name', // 'name', 'date'
      sortDirection: 'asc' // 'asc', 'desc'
    }
  },
  
  getters: {
    // Get all colors
    allColors: (state) => state.colors,
    
    // Get selected color
    selectedColor: (state) => state.selectedColor,
    
    // Get filtered colors
    filteredColors: (state) => {
      let result = [...state.colors]
      
      // Apply search filter
      if (state.filters.searchTerm) {
        const searchLower = state.filters.searchTerm.toLowerCase()
        result = result.filter(color => 
          color.name.toLowerCase().includes(searchLower) || 
          color.value.toLowerCase().includes(searchLower)
        )
      }
      
      // Apply sorting
      result.sort((a, b) => {
        let comparison = 0
        
        if (state.filters.sortBy === 'name') {
          comparison = a.name.localeCompare(b.name)
        } else if (state.filters.sortBy === 'date') {
          comparison = a.id - b.id
        }
        
        return state.filters.sortDirection === 'asc' ? comparison : -comparison
      })
      
      return result
    },
    
    // Get color history
    colorHistory: (state) => state.history,
    
    // Get color count
    colorCount: (state) => state.colors.length,
    
    // Get color by id
    getColorById: (state) => (id) => {
      return state.colors.find(color => color.id === id)
    }
  },
  
  mutations: {
    // Add a color
    ADD_COLOR(state, color) {
      state.colors.push(color)
      state.history.push({
        type: 'add',
        color,
        timestamp: new Date().toISOString()
      })
    },
    
    // Remove a color
    REMOVE_COLOR(state, id) {
      const colorToRemove = state.colors.find(c => c.id === id)
      const index = state.colors.findIndex(c => c.id === id)
      
      if (index !== -1) {
        state.colors.splice(index, 1)
        
        state.history.push({
          type: 'remove',
          color: colorToRemove,
          timestamp: new Date().toISOString()
        })
      }
    },
    
    // Select a color
    SELECT_COLOR(state, color) {
      state.selectedColor = color
    },
    
    // Clear all colors
    CLEAR_COLORS(state) {
      state.colors = []
      state.history.push({
        type: 'clear',
        timestamp: new Date().toISOString()
      })
    },
    
    // Update color
    UPDATE_COLOR(state, { id, updates }) {
      const index = state.colors.findIndex(c => c.id === id)
      if (index !== -1) {
        const oldColor = { ...state.colors[index] }
        const updatedColor = { ...oldColor, ...updates }
        
        state.colors[index] = updatedColor
        
        state.history.push({
          type: 'update',
          oldColor,
          newColor: updatedColor,
          timestamp: new Date().toISOString()
        })
        
        // Update selected color if it's the one being updated
        if (state.selectedColor && state.selectedColor.id === id) {
          state.selectedColor = updatedColor
        }
      }
    },
    
    // Set search term
    SET_SEARCH_TERM(state, term) {
      state.filters.searchTerm = term
    },
    
    // Set sort options
    SET_SORT_OPTIONS(state, { sortBy, sortDirection }) {
      if (sortBy) state.filters.sortBy = sortBy
      if (sortDirection) state.filters.sortDirection = sortDirection
    }
  },
  
  actions: {
    // Add a color
    addColor({ commit }, color) {
      // Ensure color has an id
      if (!color.id) {
        color.id = Date.now().toString()
      }
      commit('ADD_COLOR', color)
    },
    
    // Remove a color
    removeColor({ commit }, id) {
      commit('REMOVE_COLOR', id)
    },
    
    // Select a color
    selectColor({ commit }, color) {
      commit('SELECT_COLOR', color)
    },
    
    // Clear all colors
    clearColors({ commit }) {
      commit('CLEAR_COLORS')
    },
    
    // Update a color
    updateColor({ commit }, { id, updates }) {
      commit('UPDATE_COLOR', { id, updates })
    },
    
    // Set search term
    setSearchTerm({ commit }, term) {
      commit('SET_SEARCH_TERM', term)
    },
    
    // Set sort options
    setSortOptions({ commit }, options) {
      commit('SET_SORT_OPTIONS', options)
    }
  }
}