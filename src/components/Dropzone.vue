<template>
  <div class="sm-dropzone">
    <div
      class="dz-wrap"
      :class="{ 'dz-active': isDragging, 'dz-disabled': busy }"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
      @click="openPicker"
    >
      <div class="dz-inner">
        <div class="dz-icon" aria-hidden="true">📦</div>
        <div class="dz-title text-white">Drag & drop vos images ici</div>
        <div class="dz-sub">ou cliquez pour choisir un fichier localement</div>
        <input
          ref="fileInputRef"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="dz-input"
          @change="onPick"
        />
        <div class="dz-types">Compatible: .jpg, .jpeg, .png, .webp</div>
        <div v-if="error" class="dz-error">{{ error }}</div>
      </div>
    </div>

    <div v-if="previewUrl" class="dz-preview">
      <img :src="previewUrl" alt="preview" />
      <div class="dz-status">
        <span v-if="paletteColors.length">Palette ready ✓</span>
        <span v-else-if="busy">Processing…</span>
      </div>
    </div>

    <div v-if="paletteColors.length" class="dz-palette">
      <div
        v-for="(c,i) in paletteColors"
        :key="i"
        class="dz-swatch"
        :style="{ background: c }"
        :title="c"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const busy = ref(false)
const isDragging = ref(false)
const error = ref('')
const previewUrl = ref('')
const fileInputRef = ref(null)
const paletteColors = ref([])

function reset(){
  error.value = ''
  paletteColors.value = []
}

function validType(file){
  const okTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (okTypes.includes(file.type)) return true
  const name = file.name.toLowerCase()
  return ['.jpg', '.jpeg', '.png', '.webp'].some(ext => name.endsWith(ext))
}

function openPicker(){
  if (busy.value) return
  const el = fileInputRef.value
  if (el && typeof el.click === 'function') el.click()
}

function onDragOver(){
  if (busy.value) return
  isDragging.value = true
}
function onDragLeave(){
  isDragging.value = false
}
async function onDrop(e){
  isDragging.value = false
  if (busy.value) return
  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  await handleFile(file)
}

function onPick(e){
  const file = e.target.files?.[0]
  if (!file) return
  handleFile(file)
  e.target.value = ''
}

async function sendToPaletteEndpoint(file){
  const fd = new FormData()
  fd.append('file', file)
  fd.append('filename', file.name)
  try {
    const res = await fetch('https://workshopb21.vercel.app/ADD/ImgPalette', {
      method: 'POST',
      body: fd,
    })
    if (!res.ok) throw new Error(`Server error ${res.status}`)
    const ct = res.headers.get('content-type') || ''
    let data
    if (ct.includes('application/json')) {
      data = await res.json()
    } else {
      const text = await res.text()
      try { data = JSON.parse(text) } catch { data = { raw: text } }
    }
    const pal = data?.palette || data?.colors || data?.result?.palette || data?.data?.palette
    if (Array.isArray(pal) && pal.length) {
      paletteColors.value = pal
    } else {
      throw new Error('No palette returned')
    }
  } catch (err) {
    console.error('[dropzone] palette error', err)
    throw err
  }
}

async function handleFile(file){
  reset()
  if (!validType(file)){
    error.value = 'Invalid file type. Use jpg, jpeg, png, or webp.'
    return
  }
  previewUrl.value = URL.createObjectURL(file)
  busy.value = true
  try {
    await sendToPaletteEndpoint(file)
  } catch (err) {
    error.value = err?.message || 'Processing failed'
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.sm-dropzone{
  display:flex;
  flex-direction:column;
  gap:1rem;
}
.dz-wrap{
  position:relative;
  border:2px dashed #fff;
  border-radius:16px;
  padding:1.25rem;
  transition: border-color .2s ease, box-shadow .2s ease;
  cursor:pointer;
}
.dz-wrap.dz-active{
  border-color:#fff;
  box-shadow:0 0 0 4px #fff;
}
.dz-wrap.dz-disabled{
  opacity:0.6;
  pointer-events:none;
}
.dz-inner{
  position:relative;
  text-align:center;
}
.dz-icon{ font-size:2rem; }
.dz-title{ font-weight:600; }
.dz-sub{ color:#ccc; font-size:.9rem; }
.dz-input{
  position:absolute;
  inset:0;
  opacity:0;
  width:100%;
  height:100%;
  cursor:pointer;
  pointer-events:none;
}
.dz-types{ font-size:.8rem; color:#ccc; margin-top:.5rem; }
.dz-error{ font-size:.85rem; color:#d22; margin-top:.35rem; }

.dz-preview{ display:flex; align-items:center; gap:.75rem; }
.dz-preview img{ width:72px; height:72px; object-fit:cover; border-radius:12px; border:1px solid #fff; }
.dz-status{ font-size:.9rem; color:#ccc; }

.dz-palette{ display:flex; flex-wrap:wrap; gap:.5rem; margin-top:.5rem; }
.dz-swatch{ width:28px; height:28px; border-radius:6px; border:1px solid #fff2; }
</style>