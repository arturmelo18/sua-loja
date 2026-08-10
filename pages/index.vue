<template>
  <div class="h-screen w-screen bg-cream">
    <nav-bar/>
    
    <div class="hero" v-if="slides.length > 0">
      <div class="carousel" id="carousel">
        <div 
          v-for="(slide, index) in slides" 
          :key="index"
          :class="['carousel-slide', { active: currentSlide === index }]"
        >
          <div class="slide-bg" :style="{ backgroundImage: `url(${slide.image})` }"></div>
          <div class="slide-overlay"></div>
          <div class="slide-content">
            <h1>{{ slide.title }}</h1>
            <p>{{ slide.description }}</p>
          </div>
        </div>
      </div>
      
      <button class="carousel-btn prev" @click="prevSlide">‹</button>
      <button class="carousel-btn next" @click="nextSlide">›</button>
      
      <div class="carousel-dots">
        <button 
          v-for="(_, index) in slides"
          :key="index"
          :class="['c-dot', { active: currentSlide === index }]"
          @click="currentSlide = index"
        ></button>
      </div>
    </div>

    <!-- PRODUCTS SECTION -->
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">Novidades</h2>
      </div>
      <div v-if="state.products.length === 0 && !isLoading" class="flex justify-center">
        <img src="../imgs/no_products.png" class="w-[800px] h-[400px]">
      </div>
      <div v-else-if="!isLoading" class="products-grid" v-infinite-scroll="nextPage">
        <product-view v-for="product in state.products" :key="product._id" :product="product"/>
      </div>
      <div v-else class="flex justify-center">
        <span>Carregando produtos...</span>
      </div>
    </div>

    <lof-footer/>
  </div>
</template>

<script setup lang="ts">
import GradientDivisor from '~/components/GradientDivisor.vue';
import LofFooter from '~/components/LofFooter.vue';
import type { Product } from '~/types/Product';

const LIMIT = 20

const currentSlide = ref(0)
const slides = ref<{ title: string; description: string; image: string }[]>([])
const storeName = ref('')

const state = reactive({
  page: 1,
  total: 0,
  products: <Product[]>[]
})

const isLoading = ref(false)

onMounted(async () => {
  try {
    const store = await $fetch<any>('/api/store/getStore')
    if (store) {
      slides.value = store.slides
      storeName.value = store.name
    }
  } catch {
    // fallback vazio — carrossel não aparece
  }

  await fetchData()

  if (slides.value.length > 1) {
    setInterval(() => {
      currentSlide.value = (currentSlide.value + 1) % slides.value.length
    }, 5000)
  }
})

async function fetchData() {
  try {
    isLoading.value = true
    const result = await $fetch('/api/product/getProductList', {
      method: 'GET',
      params: {
        page: state.page,
        limit: LIMIT
      }
    })

    state.page = result.pagination.page
    state.total = result.pagination.total
    state.products = [...state.products, ...result.data as Product[]]
  } catch(error: any) {
    ElMessage.error(error.message || 'Erro inesperado')
  } finally {
    isLoading.value = false
  }
}

function nextPage() {
  if (state.page * LIMIT > state.total) return
  state.page += 1
  fetchData()
}

function nextSlide() {
  currentSlide.value = (currentSlide.value + 1) % slides.value.length
}

function prevSlide() {
  currentSlide.value = (currentSlide.value - 1 + slides.value.length) % slides.value.length
}
</script>

<style scoped>
.bg-cream {
  background: #F2EDE6;
}

/* ===== HERO / CAROUSEL (mobile first) ===== */
.hero {
  position: relative;
  width: 100%;
  height: 260px;
  overflow: hidden;
}

.carousel {
  position: relative;
  width: 100%;
  height: 100%;
}

.carousel-slide {
  position: absolute;
  inset: 0;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.6s ease;
}

.carousel-slide.active {
  opacity: 1;
  visibility: visible;
}

.slide-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
}

.slide-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%);
}

.slide-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 16px;
  color: #fff;
}

.slide-content h1 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.5rem;
  line-height: 1.2;
  margin-bottom: 4px;
}

.slide-content p {
  font-size: 0.85rem;
  opacity: 0.9;
  max-width: 100%;
}

.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 3;
  background: rgba(255,255,255,0.25);
  color: #fff;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(2px);
}

.carousel-btn.prev { left: 8px; }
.carousel-btn.next { right: 8px; }

.carousel-dots {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  display: flex;
  gap: 6px;
}

.c-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(255,255,255,0.5);
  border: none;
  padding: 0;
  cursor: pointer;
  transition: background 0.3s, width 0.3s;
}

.c-dot.active {
  background: #7A1F2E;
  width: 18px;
  border-radius: 4px;
}

/* ===== SECTION ===== */
.section {
  padding: 24px 16px 40px;
}

.section-header {
  margin-bottom: 16px;
}

.section-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.5rem;
  color: #7A1F2E;
  text-align: center;
}

/* ===== PRODUCTS GRID (mobile: 2 colunas) ===== */
.products-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

/* ===== TABLET (>= 640px) ===== */
@media (min-width: 640px) {
  .hero {
    height: 340px;
  }

  .slide-content {
    padding: 24px;
  }

  .slide-content h1 {
    font-size: 2rem;
  }

  .slide-content p {
    font-size: 0.95rem;
    max-width: 70%;
  }

  .carousel-btn {
    width: 38px;
    height: 38px;
    font-size: 1.3rem;
  }

  .carousel-btn.prev { left: 16px; }
  .carousel-btn.next { right: 16px; }

  .section {
    padding: 32px 24px 48px;
  }

  .section-title {
    font-size: 1.75rem;
  }

  .products-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
}

/* ===== DESKTOP (>= 1024px) ===== */
@media (min-width: 1024px) {
  .hero {
    height: 460px;
  }

  .slide-content {
    padding: 48px 64px;
  }

  .slide-content h1 {
    font-size: 3rem;
  }

  .slide-content p {
    font-size: 1.1rem;
    max-width: 45%;
  }

  .carousel-btn {
    width: 44px;
    height: 44px;
    font-size: 1.5rem;
  }

  .carousel-btn.prev { left: 32px; }
  .carousel-btn.next { right: 32px; }

  .section {
    padding: 48px 64px 64px;
    max-width: 1280px;
    margin: 0 auto;
  }

  .section-title {
    font-size: 2.25rem;
  }

  .products-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
  }
}

/* ===== WIDE DESKTOP (>= 1440px) ===== */
@media (min-width: 1440px) {
  .products-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}
</style>