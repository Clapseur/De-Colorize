import { reactive, readonly, computed } from 'vue'

const state = reactive({
  appName: 'De-Colorize',
  isDarkMode: false,
  version: '1.0.0',
  
  colors: [],
  selectedColor: null,
  searchTerm: '',
  sortOptions: {
    sortBy: 'date',
    sortDirection: 'asc'
  },
  colorHistory: []
})

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

export function useStore() {
  return store
}

export default store