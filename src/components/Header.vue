<script setup>
import { ref, onMounted, onUnmounted, onBeforeUpdate, nextTick, watch, defineProps } from 'vue'
import { gsap } from 'gsap'

const props = defineProps({
  logo: { type: String, default: '' },
  logoAlt: { type: String, default: 'Logo' },
  className: { type: String, default: '' },
  ease: { type: String, default: 'power3.out' },
  baseColor: { type: String, default: '#fff' },
  menuColor: { type: String, default: '#000' },
  buttonBgColor: { type: String, default: '#111' },
  buttonTextColor: { type: String, default: '#fff' },
  items: { type: Array, default: () => [] },
  underlayColors: { type: Array, default: () => ['#9EF2B2', '#27FF64'] },
  openMenuButtonColor: { type: String, default: '#27FF64' },
  changeMenuColorOnOpen: { type: Boolean, default: true }
})

const isHamburgerOpen = ref(false)
const isExpanded = ref(false)
const navRef = ref(null)
const cardsRef = ref([])
const tlRef = ref(null)
const underlayRefs = ref([])

const setCardRef = (i) => (el) => {
  if (el && el instanceof HTMLDivElement) {
    const arr = cardsRef.value.slice()
    arr[i] = el
    cardsRef.value = arr
  }
}

const setUnderlayRef = (i) => (el) => {
  if (el && el instanceof HTMLDivElement) {
    const arr = underlayRefs.value.slice()
    arr[i] = el
    underlayRefs.value = arr
  }
}

const calculateHeight = () => {
  const navEl = navRef.value;
  if (!navEl) return 260;

  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  if (isMobile) {
    const contentEl = navEl.querySelector('.card-nav-content');
    if (contentEl) {
      const wasVisible = contentEl.style.visibility;
      const wasPosition = contentEl.style.position;
      const wasHeight = contentEl.style.height;

      contentEl.style.visibility = 'visible';
      contentEl.style.position = 'static';
      contentEl.style.height = 'auto';

      const topBar = 60;
      const padding = 16;
      const contentHeight = contentEl.scrollHeight;

      contentEl.style.visibility = wasVisible;
      contentEl.style.position = wasPosition;
      contentEl.style.height = wasHeight;

      return topBar + contentHeight + padding;
    }
  }
  return 260;
};

const createTimeline = () => {
  const navEl = navRef.value
  if (!navEl) return null

  gsap.set(navEl, { height: 60, overflow: 'hidden' })
  gsap.set(cardsRef.value, { y: 50, opacity: 0 })
  gsap.set(underlayRefs.value, { y: 60, opacity: 0 })

  const tl = gsap.timeline({ paused: true })

  tl.to(navEl, {
    height: calculateHeight,
    duration: 0.4,
    ease: props.ease
  })

  tl.to(underlayRefs.value, { y: 0, opacity: 1, duration: 0.35, ease: props.ease, stagger: 0.06 }, '-=0.2')
  tl.to(cardsRef.value, { y: 0, opacity: 1, duration: 0.4, ease: props.ease, stagger: 0.08 }, '-=0.1')

  return tl
}

const toggleMenu = () => {
  const tl = tlRef.value
  if (!tl) return
  if (!isExpanded.value) {
    isHamburgerOpen.value = true
    isExpanded.value = true
    nextTick(() => {
      tl.play(0)
    })
  } else {
    isHamburgerOpen.value = false
    tl.eventCallback('onReverseComplete', () => {
      isExpanded.value = false
      tl.eventCallback('onReverseComplete', null)
    })
    tl.reverse()
  }
}

const handleResize = () => {
  if (!tlRef.value) return;

  if (isExpanded.value) {
    const newHeight = calculateHeight();
    gsap.set(navRef.value, { height: newHeight });

    tlRef.value.kill();
    const newTl = createTimeline();
    if (newTl) {
      newTl.progress(1);
      tlRef.value = newTl;
    }
  } else {
    tlRef.value.kill();
    tlRef.value = createTimeline();
  }
};

onBeforeUpdate(() => {
  cardsRef.value = []
})

onMounted(() => {
  tlRef.value = createTimeline()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (tlRef.value) tlRef.value.kill()
  tlRef.value = null
  window.removeEventListener('resize', handleResize)
})

watch(
  () => [props.ease, props.items],
  () => {
    nextTick(() => {
      if (tlRef.value) tlRef.value.kill()
      tlRef.value = createTimeline()
    })
  }
)
</script>
<template>
  <div
    :class="`card-nav-container absolute left-1/2 -translate-x-1/2 w-[90%] max-w-[800px] z-[99] top-[1.2em] md:top-[2em] ${props.className}`"
  >
    <nav
      ref="navRef"
      :class="[
        'card-nav block h-[60px] p-0 rounded-xl shadow-md relative overflow-hidden will-change-[height]',
        { open: isExpanded }
      ]"
      :style="{ backgroundColor: props.baseColor }"
    >
      <div
        class="card-nav-top top-0 z-[2] absolute inset-x-0 flex justify-between items-center p-2 px-[1.1rem] h-[60px]"
      >
        <div
          :class="[
            'hamburger-menu group h-full flex flex-col items-center justify-center cursor-pointer gap-[6px] order-2 md:order-none',
            { open: isHamburgerOpen }
          ]"
          @click="toggleMenu"
          role="button"
          :aria-label="isExpanded ? 'Close menu' : 'Open menu'"
          tabindex="0"
          :style="{ color: (props.changeMenuColorOnOpen && isHamburgerOpen) ? props.openMenuButtonColor : (props.menuColor || '#000') }"
        >
          <div
            :class="[
              'hamburger-line w-[30px] h-[2px] bg-current transition-[transform,opacity,margin] duration-300 ease-linear [transform-origin:50%_50%] group-hover:opacity-75',
              { 'translate-y-[4px] rotate-45': isHamburgerOpen }
            ]"
          />
          <div
            :class="[
              'hamburger-line w-[30px] h-[2px] bg-current transition-[transform,opacity,margin] duration-300 ease-linear [transform-origin:50%_50%] group-hover:opacity-75',
              { '-translate-y-[4px] -rotate-45': isHamburgerOpen }
            ]"
          />
        </div>

        <div
          class="md:top-1/2 md:left-1/2 md:absolute flex items-center order-1 md:order-none md:-translate-x-1/2 md:-translate-y-1/2 logo-container"
        >
          <img :src="props.logo" :alt="props.logoAlt" class="h-[28px] logo" />
        </div>

        <button
          type="button"
          class="hidden md:inline-flex px-4 py-2 border-0 rounded-[calc(0.75rem-0.2rem)] h-full font-medium transition-colors duration-300 cursor-pointer card-nav-cta-button"
          :style="{
            backgroundColor: props.buttonBgColor,
            color: props.buttonTextColor
          }"
        >
          Get Started
        </button>
      </div>

      <div
        :class="[
          'card-nav-content absolute left-0 right-0 top-[60px] bottom-0 p-2 flex flex-col items-stretch gap-2 justify-start z-[1] md:flex-row md:items-end md:gap-[12px]',
          isExpanded ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
        ]"
        :aria-hidden="!isExpanded"
      >
        <div class="absolute inset-0 -z-[1] flex flex-col gap-2 p-2 md:flex-row md:items-end">
          <div
            v-for="(clr, i) in props.underlayColors"
            :key="`underlay-${i}`"
            :ref="setUnderlayRef(i)"
            class="underlay-layer rounded-[calc(0.75rem-0.2rem)] min-h-[60px] md:min-h-0 md:h-full"
            :style="{ backgroundColor: clr, opacity: 0.8 }"
          ></div>
        </div>
        <div
          v-for="(item, idx) in (props.items || []).slice(0, 3)"
          :key="`${item.label}-${idx}`"
          :ref="setCardRef(idx)"
          class="relative flex flex-col flex-[1_1_auto] md:flex-[1_1_0%] gap-2 p-[12px_16px] rounded-[calc(0.75rem-0.2rem)] min-w-0 h-auto md:h-full min-h-[60px] md:min-h-0 select-none nav-card"
          :style="{ backgroundColor: item.bgColor, color: item.textColor }"
        >
          <div class="font-normal text-[18px] md:text-[22px] tracking-[-0.5px] nav-card-label">
            {{ item.label }}
          </div>
          <div class="flex flex-col gap-[2px] mt-auto nav-card-links">
            <router-link
              v-for="(lnk, i) in item.links"
              :key="`${lnk.label}-${i}`"
              class="inline-flex items-center gap-[6px] hover:opacity-75 text-[15px] md:text-[16px] no-underline transition-opacity duration-300 cursor-pointer nav-card-link"
              :to="lnk.href"
              :aria-label="lnk.ariaLabel"
            >
              <span class="shrink-0">↗</span>
              {{ lnk.label }}
            </router-link>
          </div>
        </div>
      </div>
    </nav>
  </div>
</template>
