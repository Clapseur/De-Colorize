<script setup>
import { ref } from 'vue'
import WordSearcher from './WordSearcher.vue'
import TextType from './TextAnimations/TextType/TextType.vue'
import { t } from '../i18n/index.js'

const examples = ['Vaporwave', 'Couché de soleil', 'Forêt', 'Campagne', 'Ville de nuit']
const prompt = ref('')
</script>

<template>
  <section class="container mx-auto px-4 py-10 text-white">
    <div class="mx-auto max-w-2xl p-6 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-xl shadow-lg mb-6">
      <h2 class="text-2xl font-semibold mb-3">{{ t('ai.title') }}</h2>
      <div class="text-sm text-white/70 mb-4">
        <TextType :text="examples" :pauseDuration="1600" :initialDelay="250" />
      </div>
      <input
        v-model="prompt"
        type="text"
        :placeholder="t('ai.placeholder')"
        class="w-full px-4 py-2 rounded-full bg-transparent border border-white/40 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
        @keyup.enter="$refs.ws?.submitSearch(prompt)"
        aria-label="AI palette prompt"
      />
    </div>

    <div class="mx-auto max-w-5xl">
      <WordSearcher ref="ws" />
    </div>
  </section>
</template>

<!-- No extra styles; display blur is handled in WordSearcher.vue only -->
