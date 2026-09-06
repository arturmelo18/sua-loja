<template>
  <div class="h-screen w-screen bg-cream" :style="{ '--store-color': store?.color || '#7A1F2E' }">
    <nav-bar />

    <div v-if="isLoading" class="flex justify-center items-center h-[50vh]">
      <span>Carregando loja...</span>
    </div>

    <div v-else-if="!store" class="flex justify-center items-center h-[50vh]">
      <span>Loja não encontrada.</span>
    </div>

    <div v-else class="store-page">
      <div class="store-hero">
        <div class="store-hero__content">
          <p class="store-tag">Loja</p>
          <h1>{{ store.name }}</h1>
        </div>
      </div>

      <div v-if="slides.length > 0" class="hero">
        <div class="carousel" id="carousel">
          <div
            v-for="(slide, index) in slides"
            :key="index"
            :class="['carousel-slide', { active: currentSlide === index }]"
          >
            <div class="slide-bg" :style="{ backgroundImage: `url(${slide.image})` }"></div>
            <div class="slide-overlay"></div>
            <div class="slide-content">
              <h2>{{ slide.title }}</h2>
              <p>{{ slide.description }}</p>
            </div>
          </div>
        </div>

        <button class="carousel-btn prev" @click="prevSlide">‹</button>
        <button class="carousel-btn next" @click="nextSlide">›</button>
      </div>

      <div class="section">
        <div class="section-header">
          <h2 class="section-title">Produtos da loja</h2>
        </div>

        <div v-if="products.length === 0 && !isLoadingProducts" class="flex justify-center">
          <img src="~/imgs/no_products.png" class="w-[800px] h-[400px]">
        </div>

        <div v-else-if="!isLoadingProducts" class="products-grid" v-infinite-scroll="nextPage">
          <product-view v-for="product in products" :key="product._id" :product="product" />
        </div>

        <div v-else class="flex justify-center">
          <span>Carregando produtos...</span>
        </div>
      </div>
    </div>

    <lof-footer />
  </div>
</template>

<script setup lang="ts">
import type { Product } from '~/types/Product'
import type { Store } from '~/types/Store'

const route = useRoute()
const storeSlug = computed(() => String(route.params.store || '').replace(/^@/, ''))

const isLoading = ref(true)
const isLoadingProducts = ref(false)
const currentSlide = ref(0)
const slides = ref<{ title: string; description: string; image: string }[]>([])

const products = ref<Product[]>([])
const store = ref<Store | null>(null)
const state = reactive({ page: 1, total: 0, limit: 20 })

async function loadStore() {
  isLoading.value = true

  try {
    const result = await $fetch<Store | null>('/api/store/getStore', {
      params: { store: storeSlug.value }
    })

    store.value = result

    if (result) {
      slides.value = result.slides || []
      if (slides.value.length > 1) {
        setInterval(() => {
          currentSlide.value = (currentSlide.value + 1) % slides.value.length
        }, 5000)
      }
    }
  } catch (error) {
    console.error('Erro ao carregar loja:', error)
    store.value = null
  } finally {
    isLoading.value = false
  }
}

async function loadProducts() {
  if (!storeSlug.value) return

  isLoadingProducts.value = true

  try {
    const result = await $fetch<{ data: Product[]; pagination: any }>('/api/product/getProductList', {
      params: {
        store: storeSlug.value,
        page: state.page,
        limit: state.limit,
      },
    })

    state.page = result.pagination.page
    state.total = result.pagination.total
    products.value = [...products.value, ...result.data]
  } catch (error) {
    console.error('Erro ao carregar produtos da loja:', error)
  } finally {
    isLoadingProducts.value = false
  }
}

function nextPage() {
  if (state.page * state.limit >= state.total) return
  state.page += 1
  loadProducts()
}

function nextSlide() {
  if (!slides.value.length) return
  currentSlide.value = (currentSlide.value + 1) % slides.value.length
}

function prevSlide() {
  if (!slides.value.length) return
  currentSlide.value = (currentSlide.value - 1 + slides.value.length) % slides.value.length
}

watch(
  storeSlug,
  async () => {
    products.value = []
    state.page = 1
    state.total = 0
    await loadStore()
    await loadProducts()
  },
  { immediate: true }
)
</script>

<style scoped>
.bg-cream {
  background: #F2EDE6;
}

.store-page {
  min-height: 100vh;
}

.store-hero {
  background: linear-gradient(135deg, var(--store-color) 0%, color-mix(in srgb, var(--store-color) 68%, #000) 100%);
  color: white;
  padding: 48px 24px 32px;
}

.store-hero__content {
  max-width: 1200px;
  margin: 0 auto;
}

.store-tag {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  opacity: 0.8;
  margin-bottom: 8px;
}

.store-hero h1 {
  font-size: clamp(2rem, 4vw, 3.4rem);
  font-weight: 700;
  margin: 0;
}

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

.slide-content h2 {
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
  background: color-mix(in srgb, var(--store-color) 72%, transparent);
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

.section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 28px 16px 40px;
}

.section-header {
  margin-bottom: 24px;
}

.section-title {
  font-size: clamp(1.4rem, 2.2vw, 2rem);
  font-weight: 700;
  color: #1a1a1a;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 20px;
}
</style>
