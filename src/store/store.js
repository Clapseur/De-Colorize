import createStore from './index'
import colorModule from './colorStore'
import { ref } from 'vue'

// Create the store instance
const store = createStore({
  state: {
    appName: 'De-Colorize',
    isDarkMode: true,
    version: '1.0.0'
  },
  
  getters: {
    appName: (state) => state.appName,
    isDarkMode: (state) => state.isDarkMode,
    appVersion: (state) => state.version
  },
  
  mutations: {
    TOGGLE_DARK_MODE(state) {
      state.isDarkMode = !state.isDarkMode
    },
    
    SET_APP_NAME(state, name) {
      state.appName = name
    }
  },
  
  actions: {
    toggleDarkMode({ commit }) {
      commit('TOGGLE_DARK_MODE')
    },
    
    setAppName({ commit }, name) {
      commit('SET_APP_NAME', name)
    }
  },
  
  modules: {
    colors: colorModule
  }
})

// Create a Vue composable to use the store
export function useStore() {
  return store
}

// Export the store instance
export default store