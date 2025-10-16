import createStore from './index'

const store = createStore({
  state: {
    appName: 'De-Colorize',
    isDarkMode: false,
    version: '1.0.0'
  },
  getters: {
    isDarkMode: (state) => state.isDarkMode,
    appName: (state) => state.appName,
    version: (state) => state.version
  },
  actions: {
    toggleDarkMode({ state }) {
      state.isDarkMode = !state.isDarkMode
    },
    setAppName({ state }, name) {
      state.appName = name
    }
  },
  modules: {
    colors: {
      state: {
        colors: [],
        selectedColor: null,
        searchTerm: '',
        sortOptions: {
          sortBy: 'date',
          sortDirection: 'asc'
        },
        colorHistory: []
      },
      getters: {
        allColors: (moduleState) => moduleState.colors,
        selectedColor: (moduleState) => moduleState.selectedColor,
        colorCount: (moduleState) => moduleState.colors.length,
        colorHistory: (moduleState) => moduleState.colorHistory,
        filteredColors: (moduleState) => {
          const term = moduleState.searchTerm.trim().toLowerCase()
          let list = moduleState.colors
          if (term) {
            list = list.filter(c => c.name.toLowerCase().includes(term) || c.value.toLowerCase().includes(term))
          }
          const { sortBy, sortDirection } = moduleState.sortOptions
          const dir = sortDirection === 'asc' ? 1 : -1
          return [...list].sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name) * dir
            if (sortBy === 'date') return (a.createdAt - b.createdAt) * dir
            return 0
          })
        }
      },
      mutations: {
        addColor(moduleState, color) {
          const entry = {
            id: Date.now(),
            name: color.name,
            value: color.value,
            createdAt: Date.now()
          }
          moduleState.colors.push(entry)
          moduleState.colorHistory.push({ type: 'add', color: entry, timestamp: Date.now() })
        },
        removeColor(moduleState, id) {
          const idx = moduleState.colors.findIndex(c => c.id === id)
          if (idx !== -1) {
            const removed = moduleState.colors[idx]
            moduleState.colors.splice(idx, 1)
            moduleState.colorHistory.push({ type: 'remove', color: removed, timestamp: Date.now() })
            if (moduleState.selectedColor && moduleState.selectedColor.id === id) {
              moduleState.selectedColor = null
            }
          }
        },
        selectColor(moduleState, color) {
          moduleState.selectedColor = color
        },
        clearColors(moduleState) {
          moduleState.colors = []
          moduleState.selectedColor = null
          moduleState.colorHistory.push({ type: 'clear', timestamp: Date.now() })
        },
        setSearchTerm(moduleState, term) {
          moduleState.searchTerm = term
        },
        setSortOptions(moduleState, options) {
          moduleState.sortOptions = { ...moduleState.sortOptions, ...options }
        }
      },
      actions: {
        addColor({ commit }, payload) {
          commit('addColor', payload)
        },
        removeColor({ commit }, id) {
          commit('removeColor', id)
        },
        selectColor({ commit }, color) {
          commit('selectColor', color)
        },
        clearColors({ commit }) {
          commit('clearColors')
        },
        setSearchTerm({ commit }, term) {
          commit('setSearchTerm', term)
        },
        setSortOptions({ commit }, options) {
          commit('setSortOptions', options)
        }
      }
    }
  }
})

export function useStore() {
  return store
}

export default store