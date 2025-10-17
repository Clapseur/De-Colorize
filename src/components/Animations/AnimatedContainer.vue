<template>
  <div class="animated-container pointer-events-none"></div>
</template>

<script setup>
// Simple animated gradient background container used on non-home pages
</script>

<style scoped>
.animated-container {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: radial-gradient(circle at 20% 20%, rgba(255, 0, 128, 0.25), transparent 40%),
              radial-gradient(circle at 80% 30%, rgba(0, 200, 255, 0.25), transparent 40%),
              radial-gradient(circle at 50% 80%, rgba(255, 255, 120, 0.20), transparent 40%),
              radial-gradient(circle at 10% 90%, rgba(120, 255, 200, 0.20), transparent 40%);
  filter: blur(40px) saturate(125%);
  animation: gradientShift 24s ease-in-out infinite;
  opacity: 0.8;
}

@keyframes gradientShift {
  0% {
    transform: translate3d(0,0,0) scale(1);
    filter: blur(40px) saturate(120%);
    background-position: 0% 0%, 100% 0%, 0% 100%, 100% 100%;
  }
  50% {
    transform: translate3d(0,0,0) scale(1.05);
    filter: blur(45px) saturate(130%);
    background-position: 100% 100%, 0% 100%, 100% 0%, 0% 0%;
  }
  100% {
    transform: translate3d(0,0,0) scale(1);
    filter: blur(40px) saturate(120%);
    background-position: 0% 0%, 100% 0%, 0% 100%, 100% 100%;
  }
}
</style>