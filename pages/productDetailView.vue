<template>
  <div class="h-screen w-screen bg-cream product-theme" :style="{ '--store-color': storeColor, '--burgundy': storeColor }">
    <NavBar />

    <div class="modal-overlay open">
      <div class="modal-box product-modal-box">
        <button class="modal-close-btn" @click="navigateTo('/')">×</button>

        <div class="modal-img-side">
          <img
            v-if="imgSrc"
            :src="imgSrc"
            :alt="state.product.name"
          />
          <i v-else class="uil uil-shopping-bag product-placeholder"></i>
        </div>

        <div class="modal-body-side">
          <span class="prod-badge-label">Produto</span>
          <h1 class="prod-modal-name">{{ state.product.name }}</h1>
          <span class="prod-modal-ref">REF: {{ state.product._id?.slice(-6).toUpperCase() }}</span>

          <hr class="prod-divider" />

          <div class="prod-modal-price">{{ formattedPrice }}</div>
          <div class="prod-price-unit">por unidade</div>

          <div v-if="state.product.variants?.length" class="variant-selector">
            <span class="qty-label">{{ state.product.category || 'Opção' }}</span>
            <div class="variant-options">
              <button
                v-for="variant in state.product.variants"
                :key="variant.name"
                type="button"
                :class="['variant-option', { selected: selectedVariant === variant.name }]"
                :disabled="variant.quantity <= 0"
                @click="selectVariant(variant.name)"
              >
                {{ variant.name }}
              </button>
            </div>
          </div>

          <p class="prod-modal-desc">{{ state.product.description }}</p>

          <div class="prod-stock-info">
            <span class="stock-dot"></span>
            {{ availableQuantity }} unidades em estoque
          </div>

          <span class="qty-label">Quantidade</span>
          <div class="qty-row">
            <button
              class="qty-btn"
              :disabled="state.saleQtd <= 1"
              @click="state.saleQtd--"
            >−</button>
            <span class="qty-num">{{ state.saleQtd }}</span>
            <button
              class="qty-btn"
              :disabled="state.saleQtd >= availableQuantity"
              @click="state.saleQtd++"
            >+</button>
          </div>

          <button class="btn btn-dark" style="width:100%;" :disabled="isAdding" @click="addToCart">
            <i class="ti ti-shopping-cart"></i>
            {{ isAdding ? 'Adicionando...' : 'Adicionar ao Carrinho' }}
          </button>
        </div>
      </div>
    </div>

    <LofFooter />
  </div>
</template>

<script setup lang="ts">
import type { Product } from '~/types/Product'

const route = useRoute()
const authStore = useAuthStore()
const isAdding = ref(false)
const selectedVariant = ref('')
const { storeColor, loadStoreTheme } = useStoreTheme()

const state = reactive({
  product: {} as Product,
  saleQtd: 1,
})

const imgSrc = computed(() =>
  state.product.image || null
)

const formattedPrice = computed(() =>
  Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format((Number(state.product.price) || 0) / 100)
)

const availableQuantity = computed(() => {
  if (!state.product.variants?.length) return state.product.quantity || 0
  return state.product.variants.find(variant => variant.name === selectedVariant.value)?.quantity || 0
})

onMounted(async () => {
  if (!route.query._id) return
  try {
    state.product = await $fetch<Product>('/api/product/getProduct', {
      method: 'GET',
      params: { _id: route.query._id },
    })
    selectedVariant.value = state.product.variants?.find(variant => variant.quantity > 0)?.name || ''
    await loadStoreTheme({ storeSlug: state.product.store })
  } catch {
    ElMessage.error('Erro ao carregar produto')
  }
})

async function addToCart() {
  if(!authStore.getUser) {
    ElMessage.info('Para realizar uma compra você precisa estar cadastrado em nosso site.')
    return
  }

  const cartId = authStore.getCart?._id
  if (!cartId) {
    ElMessage.error('Carrinho não encontrado')
    return
  }

  if (state.product.variants?.length && !selectedVariant.value) {
    ElMessage.warning('Escolha uma opção do produto')
    return
  }

  if (state.saleQtd > availableQuantity.value) {
    ElMessage.warning('Quantidade indisponível para esta opção')
    return
  }

  isAdding.value = true
  try {
    await $fetch('/api/cart/items/addItem', {
      method: 'POST',
      body: {
        cartId,
        productId: state.product._id,
        quantity: state.saleQtd,
        variantName: selectedVariant.value || undefined,
      },
    })
    ElMessage.success('Produto adicionado ao carrinho!')
  } catch (error: any) {
    ElMessage.error(error.data?.statusMessage || 'Erro ao adicionar ao carrinho')
  } finally {
    isAdding.value = false
  }
}
</script>

<style scoped>
.bg-cream { background: #F2EDE6; }

.product-placeholder {
  color: var(--store-color, #7A1F2E);
  font-size: 48px;
  opacity: 0.2;
}

.variant-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 8px 0 16px;
}

.variant-option {
  min-width: 44px;
  padding: 8px 12px;
  border: 1px solid color-mix(in srgb, var(--store-color, #7A1F2E) 28%, transparent);
  color: var(--store-color, #7A1F2E);
  background: transparent;
  cursor: pointer;
}

.variant-option.selected {
  color: #fff;
  background: var(--store-color, #7A1F2E);
}

.variant-option:disabled {
  cursor: not-allowed;
  opacity: .4;
}

.product-theme :deep(.btn-dark) {
  background: var(--store-color, #7A1F2E);
  border-color: var(--store-color, #7A1F2E);
}

/* ===== MODAL BASE (mobile first) ===== */
.product-modal-box {
  max-width: 100%;
  width: 100%;
  flex-direction: column;
  max-height: 95vh;
  overflow-y: auto;
}

.modal-img-side {
  width: 100%;
  height: 220px;
  flex-shrink: 0;
  background: var(--cream-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.modal-img-side img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.img-placeholder {
  opacity: 0.2;
  font-size: 56px;
  color: var(--black);
}

.modal-body-side {
  flex: 1;
  padding: 1.25rem 1.25rem 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.prod-badge-label {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--burgundy);
  margin-bottom: 6px;
  display: block;
}

.prod-modal-name {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 300;
  font-style: italic;
  line-height: 1.15;
  margin-bottom: 4px;
}

.prod-modal-ref {
  font-size: 10px;
  color: var(--gray);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  display: block;
  margin-bottom: 14px;
}

.prod-divider {
  border: none;
  border-top: 1px solid var(--border);
  margin-bottom: 14px;
}

.prod-modal-price {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 400;
  color: var(--black);
  margin-bottom: 4px;
}

.prod-price-unit {
  font-size: 12px;
  color: var(--gray);
  margin-bottom: 14px;
}

.prod-modal-desc {
  font-size: 13px;
  color: var(--gray);
  line-height: 1.65;
  margin-bottom: 16px;
}

.prod-stock-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--gray);
  margin-bottom: 16px;
}

.stock-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #4a7c59;
  flex-shrink: 0;
}

.qty-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--gray);
  margin-bottom: 8px;
  display: block;
}

.qty-row {
  display: flex;
  align-items: center;
  border: 1px solid var(--border);
  width: fit-content;
  margin-bottom: 20px;
}

.qty-btn {
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 17px;
  color: var(--black);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.qty-btn:hover:not(:disabled) { background: var(--cream-dark); }
.qty-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.qty-num {
  width: 42px;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  border-left: 1px solid var(--border);
  border-right: 1px solid var(--border);
  line-height: 36px;
}

.modal-close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 5;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255,255,255,0.85);
  border: none;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ===== TABLET (>= 640px) ===== */
@media (min-width: 640px) {
  .modal-img-side {
    height: 320px;
  }

  .modal-body-side {
    padding: 2rem 1.75rem;
  }

  .prod-modal-name {
    font-size: 25px;
  }

  .prod-modal-price {
    font-size: 24px;
  }
}

/* ===== DESKTOP (>= 900px) — layout lado a lado ===== */
@media (min-width: 900px) {
  .product-modal-box {
    max-width: 860px;
    width: auto;
    flex-direction: row;
    max-height: 92vh;
  }

  .modal-img-side {
    width: 420px;
    height: auto;
  }

  .modal-body-side {
    padding: 2.5rem 2rem;
  }

  .prod-modal-name {
    font-size: 28px;
  }

  .prod-modal-price {
    font-size: 26px;
  }

  .prod-modal-ref {
    margin-bottom: 18px;
  }

  .prod-divider {
    margin-bottom: 18px;
  }

  .prod-modal-desc {
    margin-bottom: 20px;
  }

  .prod-stock-info {
    margin-bottom: 18px;
  }

  .qty-row {
    margin-bottom: 24px;
  }

  .qty-btn {
    width: 38px;
    height: 38px;
    font-size: 18px;
  }

  .qty-num {
    width: 44px;
    font-size: 15px;
    line-height: 38px;
  }
}
</style>