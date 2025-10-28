<template>
  <div class="flex flex-col gap-3">
    <template v-if="showInput">
      <input
        v-model="searchQuery"
        class="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        type="text"
        :placeholder="t('ws.placeholder')"
        @keyup.enter="submitSearch()"
        aria-label="Search colors"
      />
    </template>
    <template v-else>
      <div
        class="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-transparent text-center ws-display"
        role="status"
        aria-live="polite"
      >
        {{ (searchQuery || '').trim() || '—' }}
      </div>
    </template>
    <p v-if="validationMessage" class="text-sm text-red-600">{{ t('ws.validation') }}</p>
    <p v-if="loading" class="text-sm text-gray-600">{{ t('ws.loading') }}</p>
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
import { t } from '../i18n/index.js'

export default {
  name: 'ExploreComponent',
  
  setup() {
    const store = useStore()
    const searchQuery = ref('')
    const showInput = ref(true)
    const validationMessage = ref('')
    const loading = ref(false)
    const errorMsg = ref('')
    const fetchedColors = ref([])
    const paletteId = ref('')
    
    const colors = computed(() => store.getters['colors/allColors'])
    const selectedColor = computed(() => store.getters['colors/selectedColor'])
    const history = computed(() => store.getters['colors/colorHistory'])
    
    const totalColors = computed(() => store.getters['colors/colorCount'])
    
    const formatTime = (timestamp) => {
      const date = new Date(timestamp)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    
    return {
      t,
      colors,
      selectedColor,
      history,
      totalColors,
      formatTime,
      searchQuery,
      validationMessage,
      loading,
      errorMsg,
      fetchedColors,
      // 🔍 Flow IA: on pousse ta requête vers l'API (create/pull)
      submitSearch: async (externalPrompt) => {
        // Allow external prompt injection (from parent views)
        if (typeof externalPrompt === 'string') {
          searchQuery.value = externalPrompt
        }
        const q = (searchQuery.value || '').trim()
        if (!q) {
          validationMessage.value = t('ws.validation')
          return
        }
        validationMessage.value = ''
        errorMsg.value = ''
        loading.value = true
        fetchedColors.value = []
        // After a short delay following user input, render the non-editable display
        setTimeout(() => { showInput.value = false }, 1200)

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

          // Parse response body regardless of status, to handle "palette existe déjà" case
          const ct = res.headers.get('content-type') || ''
          let data
          if (ct.includes('application/json')) {
            try { data = await res.json() } catch { data = null }
          } else {
            const text = await res.text().catch(() => '')
            try { data = JSON.parse(text) } catch { data = { raw: text } }
          }

          // Try to extract palette ID from both success and "exists" responses
          let createdId = data?.palette?.id
            || data?.palette_id
            || data?.palette
            || data?.id
            || data?.result?.id
            || data?.data?.id

          if (!res.ok) {
            // ℹ️ Special case: backend says the palette already exists, and gives us the ID
            const existsMsg = (data?.erreur || data?.error || '').toString().toLowerCase()
            const existsId = data?.palette || data?.palette_id || data?.id
            if (existsMsg.includes('existe') && existsId) {
              createdId = existsId
              // Friendly info banner so users know we reused an existing palette
              try {
                if (store && store.dispatch) {
                  store.dispatch('notifications/addAlert', { message: 'Palette déjà générée — ID existant utilisé', type: 'success', duration: 2500 })
                }
              } catch {}
            } else {
              const errText = (data?.erreur || data?.error || data?.raw || `HTTP ${res.status}`)
              throw new Error(typeof errText === 'string' ? errText : 'Erreur serveur')
            }
          }

          if (!createdId) {
            throw new Error('Server response did not include a palette ID')
          }
          paletteId.value = createdId

          // Second POST: pull palette by ID and render five colors
          const pullUrl = `${API_BASE}/PULL/palette/id`
          const pullRes = await fetch(pullUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uuid: paletteId.value })
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
          // 🪪 Note: si le serveur renvoie un message chelou, on le traduit gentiment.
          if (msg.includes('Les mots-clés doivent être un tableau')) {
            errorMsg.value = 'Server expects an array of words; sent JSON array.'
          } else {
            errorMsg.value = msg
          }
        } finally {
          loading.value = false
        }
      }
    }
  }
}
</script>

<style scoped>
.ws-display {
  background: rgba(255, 255, 255, 0.1);
  -webkit-backdrop-filter: blur(15px);
  backdrop-filter: blur(15px);
  color: #111;
  -webkit-text-stroke: 1px rgba(255, 255, 255, 1);
  text-shadow: 0 0 1px rgba(255, 255, 255, 0.9);
  will-change: backdrop-filter;
  contain: paint;
}
</style>
