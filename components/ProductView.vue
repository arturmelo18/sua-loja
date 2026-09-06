<template>
  <div class="product-card" :class="{ 'product-unavailable': !product.quantity }" @click="goToDetailView">
    <div class="prod-img-wrap">
      <div class="prod-img-inner">
        <img v-if="imgSrc" :src="imgSrc" :alt="product.name"/>
        <i v-else class="uil uil-shopping-bag product-placeholder"></i>
      </div>
      <div v-if="!product.quantity" class="unavailable-overlay">
        <span>Indisponível</span>
      </div>
    </div>
    <div class="prod-info">
      <span v-if="product.category" class="prod-category">{{ product.category }}</span>
      <div class="prod-name">{{ product.name }}</div>
      <div v-if="product.variants?.length" class="prod-variants">
        {{ product.variants.map(variant => variant.name).join(' · ') }}
      </div>
      <div class="prod-price-row">
        <span class="prod-price">{{ formattedPrice }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Product } from '~/types/Product'

const props = defineProps<{ product: Product }>()

const imgSrc = computed(() => props.product.image || null)

const formattedPrice = computed(() =>
  Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format((Number(props.product.price) || 0) / 100)
)

function goToDetailView() {
  if (!props.product._id || !props.product.quantity) return  // ← bloqueia clique
  navigateTo({
    path: '/productDetailView',
    query: { _id: props.product._id },
  })
}
</script>

<style scoped>
.product-card {
  position: relative;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.product-card:not(.product-unavailable):hover {
  transform: translateY(-2px);
}

.product-card:not(.product-unavailable):hover .prod-name {
  color: var(--store-color, #7A1F2E);
}

.product-unavailable {
  cursor: not-allowed;
}

.prod-img-wrap {
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: #ddd6c8;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.product-placeholder {
  color: var(--store-color, #1A1A1A);
  font-size: 48px;
  opacity: 0.2;
}

.prod-img-inner {
  width: 100%;
  height: 100%;
  transition: transform 0.6s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-card:not(.product-unavailable):hover .prod-img-inner {
  transform: scale(1.04);
}

.prod-img-inner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.prod-price {
  color: var(--store-color, #7A1F2E);
}

.prod-category,
.prod-variants {
  color: #777;
  font-size: .72rem;
}

.prod-category {
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: .08em;
}

.unavailable-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}

.unavailable-overlay span {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
  padding: 6px 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.product-unavailable .prod-img-inner img,
.product-unavailable .prod-img-inner i {
  filter: grayscale(100%);
  opacity: 0.6;
}

.product-unavailable .prod-name,
.product-unavailable .prod-price {
  color: #aaa;
}
</style>