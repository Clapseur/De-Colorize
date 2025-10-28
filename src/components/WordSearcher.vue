<template>
  <div class="flex flex-col gap-3">
    <input
      v-model="searchQuery"
      class="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      type="text"
      placeholder="Search colors..."
      @keyup.enter="submitSearch"
    />
    <div class="flex gap-2">
      <button @click="submitSearch" class="px-5 py-2.5 bg-blue-600 text-white border-none rounded font-bold hover:bg-blue-700">Send</button>
      <button @click="clearAllColors" class="px-5 py-2.5 bg-red-500 text-white border-none rounded font-bold hover:bg-red-600">Clear All Colors</button>
    </div>
    <p v-if="validationMessage" class="text-sm text-red-600">{{ validationMessage }}</p>
    <p v-if="loading" class="text-sm text-gray-600">Loading palette…</p>
    <p v-if="errorMsg" class="text-sm text-red-600">{{ errorMsg }}</p>

    <div v-if="fetchedColors.length" class="grid grid-cols-5 gap-3 mt-2">
      <div
        v-for="(c, i) in fetchedColors"
        :key="i"
        class="relative rounded-xl border border-gray-300 shadow overflow-hidden"
        :style="{ backgroundColor: c }"
      >
        <div class="w-full aspect-square"></div>
        <div class="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-black/30 text-white">
          {{ c.toUpperCase() }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue'
import { useStore } from '../store/store'

export default {
  name: 'ExploreComponent',
  
  setup() {
    const store = useStore()
    const searchQuery = ref('')
    const validationMessage = ref('')
    const loading = ref(false)
    const errorMsg = ref('')
    const fetchedColors = ref([])
    
    const colors = computed(() => store.getters['colors/allColors'])
    const selectedColor = computed(() => store.getters['colors/selectedColor'])
    const history = computed(() => store.getters['colors/colorHistory'])
    
    const totalColors = computed(() => store.getters['colors/colorCount'])
    
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
      clearAllColors: () => store.dispatch('colors/clearColors'),
      searchQuery,
      validationMessage,
      loading,
      errorMsg,
      fetchedColors,
      submitSearch: async () => {
        const q = (searchQuery.value || '').trim()
        if (!q) {
          validationMessage.value = 'Please enter some text to search.'
          return
        }
        validationMessage.value = ''
        errorMsg.value = ''
        loading.value = true
        fetchedColors.value = []

        const words = q.split(/\s+/).filter(Boolean)
        const API_BASE = (import.meta?.env?.VITE_API_BASE_URL || 'https://workshopb21.vercel.app')
        const createUrl = `${API_BASE}/ADD/palette/ia`

        try {
          // First POST: create palette for given words and receive an ID
          const res = await fetch(createUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ words })
          })

          if (!res.ok) {
            const errText = await res.text().catch(() => '')
            throw new Error(errText || `HTTP ${res.status}`)
          }

          const ct = res.headers.get('content-type') || ''
          let data
          if (ct.includes('application/json')) {
            data = await res.json()
          } else {
            const text = await res.text()
            try { data = JSON.parse(text) } catch { data = { raw: text } }
          }
          // Extract palette ID like Dropzone
          const paletteId = data?.palette?.id
            || data?.palette_id
            || data?.palette
            || data?.id
            || data?.result?.id
            || data?.data?.id
          if (!paletteId) {
            throw new Error('Server response did not include a palette ID')
          }

          // Second POST: pull palette by ID and render five colors
          const pullUrl = `${API_BASE}/PULL/palette/id`
          const pullRes = await fetch(pullUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uuid: paletteId })
          })
          if (!pullRes.ok) {
            const t = await pullRes.text().catch(() => '')
            throw new Error(t || `HTTP ${pullRes.status}`)
          }
          const pullCT = pullRes.headers.get('content-type') || ''
          let pullData
          if (pullCT.includes('application/json')) {
            pullData = await pullRes.json()
          } else {
            const t = await pullRes.text()
            try { pullData = JSON.parse(t) } catch { pullData = { raw: t } }
          }

          const hexes = pullData?.hexadecimal
            || pullData?.palette?.hexadecimal
            || pullData?.data?.hexadecimal
          if (Array.isArray(hexes) && hexes.length) {
            fetchedColors.value = hexes.slice(0, 5)
          } else {
            const pal = pullData?.palette || pullData?.colors || pullData?.result?.palette || pullData?.data?.palette
            if (Array.isArray(pal) && pal.length) {
              fetchedColors.value = pal.slice(0, 5)
            } else {
              throw new Error('No palette found for received ID')
            }
          }
        } catch (e) {
          const msg = (e && typeof e.message === 'string') ? e.message : 'Unknown error'
          // Map server French validation message if present
          if (msg.includes('Les mots-clés doivent être un tableau')) {
            errorMsg.value = 'Server expects an array of words; sent JSON array.'
          } else {
            errorMsg.value = msg
          }
        } finally {
          loading.value = false
        }
         const id = data?.palette?.id || data?.palette || data?.id || data?.result?.id || data?.data?.id
  if (!id) {
    throw new Error('Réponse distante sans identifiant de palette')
  }
  paletteId.value = id

  // fetch palette by id
  const pullUrl = `${API_BASE}/PULL/palette/id`
  const pullRes = await fetch(pullUrl, {
     method: 'POST',
     body: JSON.stringify({
       "uuid": paletteId.value
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  if (!pullRes.ok) {
    const t = await pullRes.text().catch(() => '')
    throw new Error(`Echec de récupération de palette ${pullRes.status}: ${t}`)
  }
  const pullCT = pullRes.headers.get('content-type') || ''
  let pullData
  if (pullCT.includes('application/json')) {
    pullData = await pullRes.json()
  } else {
    const t = await pullRes.text()
    try { pullData = JSON.parse(t) } catch { pullData = { raw: t } }
  }
      }
    }
  }
}
</script>
