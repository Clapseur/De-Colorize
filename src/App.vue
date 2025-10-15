<script setup>
import Color from './components/Color.vue'
import Explore from './components/Explore.vue'
</script>

<template>
  <div class="app" :class="{ 'dark-mode': isDarkMode }">
    <header>
      <div class="logo-container">
        <a href="https://vuejs.org/" target="_blank">
          <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
        </a>
      </div>
      <h1>Color Manager App</h1>
    </header>
    
    <main>
      <div class="tabs">
        <button 
          @click="activeTab = 'color'" 
          :class="{ active: activeTab === 'color' }"
        >
          Color Manager
        </button>
        <button 
          @click="activeTab = 'explore'" 
          :class="{ active: activeTab === 'explore' }"
        >
          Explore
        </button>
      </div>
      
      <div class="tab-content">
        <Color v-if="activeTab === 'color'" />
        <Explore v-if="activeTab === 'explore'" />
      </div>
    </main>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useStore } from './store/store'

export default {
  setup() {
    const store = useStore()
    const activeTab = ref('color')
    
    return {
      activeTab,
      isDarkMode: computed(() => store.getters.isDarkMode)
    }
  }
}
</script>