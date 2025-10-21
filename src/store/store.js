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
            const removed = moduleState.colors.splice(idx, 1)[0]
            moduleState.colorHistory.push({ type: 'remove', color: removed, timestamp: Date.now() })
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
    },

    // New: palette generation module
    palette: {
      state: {
        imageUrl: '',
        fileName: '',
        colors: [],
        primaryColor: '',
        secondaryColor: '',
        variations: {
          primary: { lighter: [], darker: [] },
          secondary: { lighter: [], darker: [] }
        },
        generatedAt: 0
      },
      getters: {
        palette(state) { return state },
      },
      mutations: {
        setPalette(state, payload) {
          const { imageUrl, fileName, colors } = payload
          state.imageUrl = imageUrl
          state.fileName = fileName
          state.colors = Array.isArray(colors) ? colors.slice(0, 5) : []
          state.primaryColor = state.colors[0] || ''
          state.secondaryColor = state.colors[1] || state.colors[0] || ''
          state.variations = {
            primary: computeVariations(state.primaryColor),
            secondary: computeVariations(state.secondaryColor)
          }
          state.generatedAt = Date.now()
        },
        clearPalette(state){
          state.imageUrl = ''
          state.fileName = ''
          state.colors = []
          state.primaryColor = ''
          state.secondaryColor = ''
          state.variations = { primary: { lighter: [], darker: [] }, secondary: { lighter: [], darker: [] } }
          state.generatedAt = 0
        }
      },
      actions: {
        setPalette({ commit }, payload){ commit('setPalette', payload) },
        clearPalette({ commit }){ commit('clearPalette') }
      }
    },

    // New: notifications module
    notifications: {
      state: {
        alerts: [] // { id, message, type: 'error'|'success', createdAt, duration }
      },
      getters: {
        alerts(moduleState){ return moduleState.alerts }
      },
      mutations: {
        addAlert(moduleState, alert){
          moduleState.alerts.push(alert)
        },
        removeAlert(moduleState, id){
          const idx = moduleState.alerts.findIndex(a => a.id === id)
          if (idx !== -1) moduleState.alerts.splice(idx, 1)
        },
        clearAlerts(moduleState){ moduleState.alerts = [] }
      },
      actions: {
        addAlert({ commit }, { message, type = 'error', duration = 0 }){
          const id = Date.now() + Math.random()
          const alert = { id, message, type, createdAt: Date.now(), duration }
          commit('addAlert', alert)
          if (duration && duration > 0){
            setTimeout(() => commit('removeAlert', id), duration)
          }
        },
        removeAlert({ commit }, id){ commit('removeAlert', id) },
        clearAlerts({ commit }){ commit('clearAlerts') }
      }
    }
  }
})

// Helpers for palette variations
function hexToRgb(hex){
  const s = hex.replace('#','')
  if (s.length === 3) {
    const r = parseInt(s[0]+s[0],16), g = parseInt(s[1]+s[1],16), b = parseInt(s[2]+s[2],16)
    return [r,g,b]
  }
  const r = parseInt(s.slice(0,2),16), g = parseInt(s.slice(2,4),16), b = parseInt(s.slice(4,6),16)
  return [r,g,b]
}
function rgbToHex(r,g,b){
  const h = (v)=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')
  return `#${h(r)}${h(g)}${h(b)}`
}
function rgbToHsl(r,g,b){
  r/=255; g/=255; b/=255
  const max=Math.max(r,g,b), min=Math.min(r,g,b)
  let h, s, l=(max+min)/2
  if(max===min){ h=s=0 }
  else {
    const d=max-min
    s=l>0.5? d/(2-max-min): d/(max+min)
    switch(max){
      case r: h=(g-b)/d + (g<b?6:0); break
      case g: h=(b-r)/d + 2; break
      case b: h=(r-g)/d + 4; break
    }
    h/=6
  }
  return [h,s,l]
}
function hslToRgb(h,s,l){
  let r,g,b
  if(s===0){ r=g=b=l }
  else {
    const hue2rgb=(p,q,t)=>{ if(t<0) t+=1; if(t>1) t-=1; if(t<1/6) return p+(q-p)*6*t; if(t<1/2) return q; if(t<2/3) return p+(q-p)*(2/3 - t)*6; return p }
    const q=l<0.5? l*(1+s): l+s - l*s
    const p=2*l - q
    r=hue2rgb(p,q,h+1/3)
    g=hue2rgb(p,q,h)
    b=hue2rgb(p,q,h-1/3)
  }
  return [Math.round(r*255), Math.round(g*255), Math.round(b*255)]
}
function adjustLightness(hex, delta){
  try {
    const [r,g,b]=hexToRgb(hex)
    let [h,s,l]=rgbToHsl(r,g,b)
    l = Math.max(0, Math.min(1, l + delta))
    const [nr,ng,nb]=hslToRgb(h,s,l)
    return rgbToHex(nr,ng,nb)
  } catch { return hex }
}
function computeVariations(hex){
  if (!hex) return { lighter: [], darker: [] }
  const steps = [0.1, 0.2]
  const lighter = steps.map(d => adjustLightness(hex, d))
  const darker = steps.map(d => adjustLightness(hex, -d))
  return { lighter, darker }
}

export function useStore() {
  return store
}

export default store