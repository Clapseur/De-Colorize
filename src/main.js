import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import store from './store/store'

const app = createApp(App)

// Make store available globally
app.config.globalProperties.$store = store

// Mount the app
app.mount('#app')
