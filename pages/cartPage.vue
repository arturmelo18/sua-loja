<template>
    <div class="page-wrapper-cart" :style="{ '--store-color': storeColor, '--burgundy': storeColor }">
        <header class="admin-top-nav">
            <NavBar />
        </header>

        <main class="cart-main">
            <h1 class="page-title">Meu Carrinho</h1>

            <div v-if="isLoading" class="loading-state">
                <el-skeleton :rows="4" animated />
            </div>

            <div v-else-if="!state.cart?.items?.length" class="empty-state">
                <i class="ti ti-shopping-cart-off"></i>
                <p>Seu carrinho está vazio</p>
                <el-button class="btn-primary" @click="navigateTo('/')">Ver Produtos</el-button>
            </div>

            <div v-else class="cart-layout">
                <!-- Itens -->
                <div class="cart-items card">
                    <span class="section-title">
                        Itens
                        <span class="items-count">{{ totalItems }} produto{{ totalItems !== 1 ? 's' : '' }}</span>
                    </span>

                    <div v-for="item in state.cart.items" :key="item._id" class="cart-item">
                        <div class="item-image">
                            <img
                                v-if="item.product?.image"
                                :src="item.product.image"
                                :alt="item.product?.name"
                            />
                            <i v-else class="uil uil-shopping-bag"></i>
                        </div>

                        <div class="item-body">
                            <span class="item-name">{{ item.product?.name }}</span>
                            <span v-if="item.variantName" class="item-variant">{{ item.product?.category || 'Opção' }}: {{ item.variantName }}</span>
                            <span class="item-ref">REF: {{ item.product?._id?.slice(-6).toUpperCase() }}</span>
                            <span class="item-price">{{ formatPrice(calculateItemPrice(item)) }}</span>

                            <div class="item-actions">
                                <div class="qty-ctrl">
                                    <button
                                        class="qty-btn"
                                        :disabled="item.quantity <= 1 || isUpdating"
                                        @click="updateQuantity(item, item.quantity - 1)"
                                        aria-label="Diminuir quantidade"
                                    >−</button>
                                    <span class="qty-val">{{ item.quantity }}</span>
                                    <button
                                        class="qty-btn"
                                        :disabled="item.quantity >= availableQuantity(item) || isUpdating"
                                        @click="updateQuantity(item, item.quantity + 1)"
                                        aria-label="Aumentar quantidade"
                                    >+</button>
                                </div>
                                <button class="btn-remove" :disabled="isUpdating" @click="removeItem(item._id)">
                                    <i class="ti ti-trash"></i> Remover
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Resumo -->
                <div class="cart-summary card">
                    <span class="section-title">Resumo do Pedido</span>

                    <div class="summary-row">
                        <span>Subtotal ({{ totalItems }} {{ totalItems !== 1 ? 'itens' : 'item' }})</span>
                        <span>{{ formatPrice(subtotal / 100) }}</span>
                    </div>
                    <div class="summary-row total">
                        <span>Total</span>
                        <span class="total-price">{{ formatPrice(subtotal / 100) }}</span>
                    </div>

                    <el-button class="btn-primary w-full" @click="checkout">
                        Finalizar Compra
                    </el-button>

                    <div class="security-note">
                        <i class="ti ti-lock"></i>
                        Compra segura e protegida
                    </div>
                </div>
            </div>
        </main>

        <LofFooter />
    </div>
</template>

<script lang="ts" setup>
import type { Cart, CartItem } from '~/types/Cart'

const authStore = useAuthStore()
const { storeColor, loadStoreTheme } = useStoreTheme()
const isUpdating = ref(false)
const isLoading = ref(false)

const state = reactive({
    cart: null as Cart | null,
})

const totalItems = computed(() =>
    state.cart?.items.reduce((acc, item) => acc + item.quantity, 0) ?? 0
)

const subtotal = computed(() =>
    state.cart?.items.reduce((acc, item) => {
        const price = item.price ?? item.product?.price ?? 0
        return acc + price * item.quantity
    }, 0) ?? 0
)

const formatPrice = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function calculateItemPrice(item: CartItem): number {
    const price = item.price ?? item.product?.price ?? 0
    return (price * item.quantity) / 100
}

function availableQuantity(item: CartItem): number {
    if (!item.variantName || !item.product?.variants?.length) return item.product?.quantity ?? 0
    return item.product.variants.find(variant => variant.name === item.variantName)?.quantity ?? 0
}

onMounted(async () => {
    await loadStoreTheme({ ownerId: authStore.getUser?._id })
    isLoading.value = true
    const userId = authStore.getUser?._id

    try {
        state.cart = await $fetch('/api/cart/getCart', {
            method: 'GET',
            params: { userId },
        })
        console.log('cart:', JSON.stringify(state.cart?.items?.[0], null, 2))
    } catch (e) {
        console.error('erro getCart:', e)
    }

    if (!state.cart) {
        try {
            state.cart = await $fetch('/api/cart/createCart', {
                method: 'POST',
                body: { userId },
            })
        } catch (e) {
            console.error('Erro ao criar carrinho:', e)
        }
    }

    if (state.cart) authStore.setCart(state.cart)
    isLoading.value = false
})

async function updateQuantity(item: CartItem, newQty: number) {
    if (newQty < 1 || newQty > (item.product?.quantity ?? 0)) return
    isUpdating.value = true
    try {
        await $fetch('/api/cart/items/updateItem', {
            method: 'PATCH',
            body: { cartItemId: item._id, quantity: newQty },
        })
        const index = state.cart!.items.findIndex(i => i._id === item._id)
        if (index !== -1) {
            state.cart!.items[index] = { ...state.cart!.items[index], quantity: newQty } as CartItem
        }
    } catch {
        ElMessage.error('Erro ao atualizar quantidade')
    } finally {
        isUpdating.value = false
    }
}

async function removeItem(cartItemId: string) {
    try {
        await $fetch('/api/cart/items/deleteItem', {
            method: 'DELETE',
            params: { cartItemId, cartId: state.cart?._id },
        })
        state.cart!.items = state.cart!.items.filter(i => i._id !== cartItemId)
        ElMessage.success('Item removido')
    } catch {
        ElMessage.error('Erro ao remover item')
    }
}

function checkout() {
    navigateTo('/checkout')
}

definePageMeta({ middleware: 'auth' })
</script>

<style scoped>
.page-wrapper-cart {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: #F2EDE6;
}

.admin-top-nav {
    background: #fff;
    border-bottom: 1px solid rgba(74, 15, 1, 0.06);
}

.page-wrapper-cart :deep(.btn-primary),
.page-wrapper-cart :deep(.btn-dark) {
    background: var(--store-color, #7A1F2E) !important;
    border-color: var(--store-color, #7A1F2E) !important;
}

.cart-main {
    flex: 1;
    padding: 3rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
}

.page-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 38px;
    font-weight: 300;
    font-style: italic;
    color: var(--black);
    margin-bottom: 2rem;
}

.cart-layout {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 1.5rem;
    align-items: start;
}

.card {
    background: #fff;
    border: 1px solid var(--border);
    overflow: hidden;
}

.section-title {
    display: block;
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 18px;
    font-weight: 400;
    color: var(--black);
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--border);
}

.items-count {
    font-family: var(--font-body);
    font-size: 13px;
    color: var(--gray);
    font-weight: 400;
    margin-left: 8px;
}

.cart-item {
    display: grid;
    grid-template-columns: 96px 1fr;
    gap: 1.25rem;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--border);
}

.cart-item:last-child {
    border-bottom: none;
}

.item-image {
    width: 96px;
    height: 96px;
    background: var(--cream-dark);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border);
    overflow: hidden;
}

.item-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.item-image i {
    font-size: 28px;
    color: #c0a090;
}

.item-body {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.item-name {
    font-size: 15px;
    font-weight: 500;
    color: var(--black);
    line-height: 1.4;
}

.item-ref {
    font-size: 11px;
    color: var(--gray);
    letter-spacing: 0.04em;
    text-transform: uppercase;
}

.item-price {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 20px;
    font-weight: 400;
    color: var(--black);
}

.item-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-top: 8px;
}

.qty-ctrl {
    display: flex;
    align-items: center;
    border: 1px solid var(--border);
}

.qty-btn {
    width: 32px;
    height: 32px;
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 16px;
    color: var(--black);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
}

.qty-btn:hover:not(:disabled) { background: var(--cream-dark); }
.qty-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.qty-val {
    width: 36px;
    text-align: center;
    font-size: 14px;
    font-weight: 500;
    color: var(--black);
    border-left: 1px solid var(--border);
    border-right: 1px solid var(--border);
    line-height: 32px;
}

.btn-remove {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 12px;
    color: var(--gray);
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 0;
    transition: color 0.15s;
    letter-spacing: 0.04em;
    text-transform: uppercase;
}

.btn-remove:hover { color: #c0392b; }
.btn-remove:disabled { opacity: 0.4; cursor: not-allowed; }

.cart-summary {
    padding: 0;
}

.summary-row {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: var(--gray);
    padding: 0.75rem 1.5rem;
    border-bottom: 1px solid var(--border);
}

.summary-row.total {
    font-size: 17px;
    font-weight: 500;
    color: var(--black);
    padding: 1rem 1.5rem;
}

.total-price { color: var(--black); }

.btn-primary {
    display: block;
    width: calc(100% - 3rem);
    margin: 1.25rem 1.5rem;
    background: var(--black) !important;
    border-color: var(--black) !important;
    color: #fff !important;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border-radius: 0 !important;
    padding: 13px !important;
    transition: all 0.3s;
}

.btn-primary:hover {
    background: var(--burgundy) !important;
    border-color: var(--burgundy) !important;
}

.security-note {
    display: flex;
    align-items: center;
    gap: 6px;
    justify-content: center;
    padding-bottom: 1.25rem;
    font-size: 12px;
    color: var(--gray);
}

.empty-state { text-align: center; padding: 5rem 2rem; }
.empty-state i { font-size: 56px; color: #c0a090; display: block; margin-bottom: 1rem; }
.empty-state p { color: var(--gray); font-size: 15px; margin-bottom: 1.5rem; }
.loading-state { padding: 2rem 0; }

@media (max-width: 900px) {
    .cart-layout { grid-template-columns: 1fr; }
    .cart-main { padding: 1.5rem 1rem; }
}
</style>