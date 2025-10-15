import { reactive, readonly, computed, watch } from 'vue'

// Create a central store with modules support
const createStore = (options) => {
  const { state: rawState, getters: rawGetters, mutations, actions, modules } = options
  
  // Initialize state
  const state = reactive({
    ...rawState || {}
  })
  
  // Process modules
  const moduleGetters = {}
  const moduleActions = {}
  const moduleMutations = {}
  
  if (modules) {
    Object.entries(modules).forEach(([moduleName, module]) => {
      // Add module state
      state[moduleName] = module.state || {}
      
      // Process module getters
      if (module.getters) {
        Object.entries(module.getters).forEach(([getterName, getter]) => {
          moduleGetters[`${moduleName}/${getterName}`] = () => 
            getter(state[moduleName], moduleGetters, state)
        })
      }
      
      // Process module mutations
      if (module.mutations) {
        Object.entries(module.mutations).forEach(([mutationName, mutation]) => {
          moduleMutations[`${moduleName}/${mutationName}`] = (payload) => 
            mutation(state[moduleName], payload)
        })
      }
      
      // Process module actions
      if (module.actions) {
        Object.entries(module.actions).forEach(([actionName, action]) => {
          moduleActions[`${moduleName}/${actionName}`] = (payload) => 
            action({ 
              state: state[moduleName], 
              rootState: state,
              commit: (type, payload) => {
                const namespaced = type.includes('/') ? type : `${moduleName}/${type}`
                commit(namespaced, payload)
              },
              dispatch,
              getters: moduleGetters
            }, payload)
        })
      }
    })
  }
  
  // Setup getters
  const getters = {}
  
  if (rawGetters) {
    Object.entries(rawGetters).forEach(([key, getter]) => {
      getters[key] = computed(() => getter(state, getters))
    })
  }
  
  // Add module getters
  Object.entries(moduleGetters).forEach(([key, getter]) => {
    getters[key] = computed(getter)
  })
  
  // Setup commit function for mutations
  const commit = (type, payload) => {
    if (moduleMutations[type]) {
      moduleMutations[type](payload)
      return
    }
    
    if (mutations && mutations[type]) {
      mutations[type](state, payload)
    } else {
      console.warn(`Unknown mutation type: ${type}`)
    }
  }
  
  // Setup dispatch function for actions
  const dispatch = (type, payload) => {
    if (moduleActions[type]) {
      return moduleActions[type](payload)
    }
    
    if (actions && actions[type]) {
      return actions[type]({
        state,
        getters,
        commit,
        dispatch
      }, payload)
    } else {
      console.warn(`Unknown action type: ${type}`)
      return Promise.resolve()
    }
  }
  
  // Setup persistence if localStorage is available
  const STORAGE_KEY = 'de-colorizer-store'
  
  // Load state from localStorage if available
  try {
    const savedState = localStorage.getItem(STORAGE_KEY)
    if (savedState) {
      const parsed = JSON.parse(savedState)
      Object.keys(parsed).forEach(key => {
        if (state[key] !== undefined) {
          Object.assign(state[key], parsed[key])
        }
      })
    }
  } catch (e) {
    console.error('Failed to load state from localStorage', e)
  }
  
  // Save state to localStorage on changes
  watch(() => JSON.stringify(state), (newState) => {
    try {
      localStorage.setItem(STORAGE_KEY, newState)
    } catch (e) {
      console.error('Failed to save state to localStorage', e)
    }
  }, { deep: true })
  
  return {
    state: readonly(state),
    getters: readonly(getters),
    commit,
    dispatch
  }
}

export default createStore