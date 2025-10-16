import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import store from './store/store'

import router from './router/index.js'

const app = createApp(App)

// Make store available globally
app.config.globalProperties.$store = store

// Use router
app.use(router)

// Mount the app
app.mount('#app')
