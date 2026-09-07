<template>
  <div class="h-screen w-screen bg-cream checkout-theme" :style="{ '--store-color': storeColor, '--burgundy': storeColor }">
    <NavBar />

    <div class="checkout-wrapper">
      <div class="checkout-card">
        <h1 class="checkout-title">Finalizar Pedido</h1>

        <div class="order-summary">
          <span class="summary-label">Resumo</span>

          <div v-for="item in cartItems" :key="item._id" class="order-item">
            <span class="order-item-name">{{ item.product.name }}</span>
            <span class="order-item-qty">× {{ item.quantity }}</span>
            <span class="order-item-price">{{ formatPrice((item.price ?? item.product.price) * item.quantity) }}</span>
          </div>

          <div class="order-total">
            <span>Total</span>
            <span class="total-value">{{ formatPrice(total) }}</span>
          </div>
        </div>

        <div class="delivery-info">
          <span class="summary-label">Endereço de entrega</span>
          <p class="address-text">
            {{ user?.address?.street }}, {{ user?.address?.number }}
            <span v-if="user?.address?.complement"> — {{ user.address.complement }}</span><br />
            {{ user?.address?.neighborhood }} · {{ user?.address?.city }}/{{ user?.address?.state }}<br />
            CEP {{ user?.address?.zipcode }}
          </p>
        </div>

        <button class="btn btn-dark" :disabled="isLoading" @click="goToPayment" style="width: 100%;">
          {{ isLoading ? 'Aguarde...' : 'Ir para Pagamento' }}
        </button>

        <button class="btn btn-outline" @click="navigateTo('/cart')" style="width: 100%; margin-top: 10px;">
          Voltar ao Carrinho
        </button>
      </div>
    </div>

    <LofFooter />
  </div>
</template>

<script setup lang="ts">
import type { CartItem } from '~/types/Cart'

const authStore = useAuthStore()
const { storeColor, loadStoreTheme } = useStoreTheme()
const isLoading = ref(false)

const user = computed(() => authStore.getUser)
const cart = computed(() => authStore.getCart)

const cartItems = computed(() => (cart.value?.items ?? []) as CartItem[])

const total = computed(() =>
  cartItems.value.reduce((acc, i) => acc + (i.price ?? i.product.price) * i.quantity, 0)
)

const formatPrice = (value: number) =>
  (value / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

onMounted(() => loadStoreTheme({ ownerId: authStore.getUser?._id }))

async function goToPayment() {
  if (!cart.value?._id || !user.value?._id) {
    ElMessage.error('Dados do carrinho não encontrados')
    return
  }

  isLoading.value = true
  try {
    const { checkoutUrl } = await $fetch<{ orderId: string; checkoutUrl: string }>(
      '/api/order/createOrder',
      {
        method: 'POST',
        body: {
          cartId: cart.value._id,
          userId: user.value._id,
          store: cart.value.store,
        },
      }
    )

    // Redireciona para a página de pagamento da AbacatePay
    window.location.href = checkoutUrl
  } catch (error: any) {
    ElMessage.error(error.data?.statusMessage || 'Erro ao iniciar pagamento')
  } finally {
    isLoading.value = false
  }
}

definePageMeta({ middleware: 'auth' })
</script>

<style scoped>
.bg-cream { background: #F2EDE6; }

.checkout-theme :deep(.btn-dark),
.checkout-theme :deep(.btn-outline) {
  border-color: var(--store-color, #7A1F2E);
}

.checkout-theme :deep(.btn-dark) {
  background: var(--store-color, #7A1F2E);
}

/* ===== WRAPPER (mobile first) ===== */
.checkout-wrapper {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 1.25rem 1rem;
  min-height: calc(100vh - 64px);
}

.checkout-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem 1.25rem;
  width: 100%;
  max-width: 560px;
  border: 0.5px solid rgba(74, 15, 1, 0.07);
}

.checkout-title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 300;
  font-style: italic;
  color: var(--black);
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border);
}

.summary-label {
  display: block;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--gray);
  margin-bottom: 0.75rem;
}

.order-summary {
  margin-bottom: 1.5rem;
}

.order-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(74, 15, 1, 0.05);
  font-size: 13px;
}

.order-item-name {
  flex: 1 1 100%;
  color: var(--black);
}

.order-item-qty {
  color: var(--gray);
  font-size: 12px;
}

.order-item-price {
  font-weight: 500;
  color: var(--black);
  margin-left: auto;
  text-align: right;
}

.order-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  margin-top: 4px;
  font-weight: 500;
  font-size: 15px;
}

.total-value { color: var(--store-color, #7A1F2E); font-size: 17px; }

.delivery-info {
  background: #F2EDE6;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.address-text {
  font-size: 13px;
  color: var(--gray);
  line-height: 1.65;
}

.btn-outline {
  background: transparent;
  color: var(--black);
  border: 1px solid var(--border);
}

.btn-outline:hover {
  border-color: var(--black);
}

/* ===== TABLET / DESKTOP (>= 640px) ===== */
@media (min-width: 640px) {
  .checkout-wrapper {
    padding: 3rem 2rem;
  }

  .checkout-card {
    padding: 2.5rem;
  }

  .checkout-title {
    font-size: 28px;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
  }

  .summary-label {
    margin-bottom: 1rem;
  }

  .order-summary {
    margin-bottom: 2rem;
  }

  .order-item {
    flex-wrap: nowrap;
    gap: 8px;
    font-size: 14px;
  }

  .order-item-name {
    flex: 1;
  }

  .order-item-qty {
    font-size: 13px;
  }

  .order-item-price {
    min-width: 80px;
    margin-left: 0;
  }

  .order-total {
    font-size: 16px;
  }

  .total-value { font-size: 18px; }

  .delivery-info {
    padding: 1.25rem;
    margin-bottom: 2rem;
  }

  .address-text {
    font-size: 14px;
    line-height: 1.7;
  }
}
</style>