<template>
  <div class="landing-page">
    <header class="landing-nav">
      <button class="landing-brand" type="button" @click="navigateTo('/')">Sua Loja</button>
      <nav class="landing-nav__links" aria-label="Navegação principal">
        <a href="#lojas">Explorar lojas</a>
        <a href="#como-funciona">Como funciona</a>
        <a href="#loja-demo">Loja demo</a>
      </nav>
      <ClientOnly>
        <div class="landing-nav__actions" v-if="!authStore.getUser">
          <button class="landing-login" type="button" @click="navigateTo('/loginPage')">Entrar</button>
          <button class="landing-create" type="button" @click="navigateTo('/createUser?intent=store')">Criar minha loja</button>
        </div>
        <div class="landing-nav__actions" v-else>
          <button class="landing-create" type="button" @click="navigateTo(authStore.isSuperAdmin ? '/superAdminPage' : '/userPage')">Administre sua conta</button>
        </div>
      </ClientOnly>
    </header>

    <main>
      <section class="landing-hero">
        <div class="hero-copy">
          <p class="eyebrow">Sua loja, do seu jeito</p>
          <h1>Crie um espaço que tenha a sua cara.</h1>
          <p class="hero-description">
            O Sua Loja ajuda você a transformar seus produtos em uma vitrine bonita,
            simples de administrar e pronta para vender.
          </p>
          <ClientOnly>
            <div class="hero-actions" v-if="!authStore.getUser">
              <button class="primary-button" type="button" @click="navigateTo('/createUser?intent=store')">
                Criar minha loja
              </button>
              <button class="text-button" type="button" @click="navigateTo('/loginPage')">
                Já tenho uma conta <span>→</span>
              </button>
            </div>
            <div class="hero-actions" v-else>
              <button class="primary-button" type="button" @click="navigateTo(authStore.isSuperAdmin ? '/superAdminPage' : '/userPage')">
                Ir para minha conta
              </button>
            </div>
          </ClientOnly>
        </div>

        <div class="demo-window" aria-label="Prévia de uma loja criada no Sua Loja">
          <div class="demo-window__bar">
            <span></span><span></span><span></span>
            <small>sualoja / amora</small>
          </div>
          <div class="demo-store-head">
            <p>LOJA AMORA</p>
            <strong>Peças para todos os seus dias.</strong>
          </div>
          <div class="demo-products">
            <div v-for="product in demoProducts" :key="product.name" class="demo-product">
              <div class="demo-product__image" :style="{ background: product.color }"></div>
              <span>{{ product.name }}</span>
              <strong>{{ product.price }}</strong>
            </div>
          </div>
          <div class="demo-window__footer">Uma vitrine simples. Uma marca memorável.</div>
        </div>
      </section>

      <section id="lojas" class="stores-section">
        <div class="section-intro">
          <p class="eyebrow">Vitrine da Comunidade</p>
          <h2>Explore as lojas ativas.</h2>
          <p class="stores-intro-desc">
            Conheça os espaços criados por empreendedores e compre diretamente dos seus produtores favoritos.
          </p>
        </div>

        <div v-if="loadingStores" class="stores-grid">
          <div v-for="n in 3" :key="n" class="store-card store-card--skeleton">
            <div class="store-card__banner skeleton-shimmer"></div>
            <div class="store-card__body">
              <div class="skeleton-line" style="width: 60%; height: 22px;"></div>
              <div class="skeleton-line" style="width: 40%; height: 14px; margin-top: 8px;"></div>
              <div class="skeleton-line" style="width: 90%; height: 14px; margin-top: 14px;"></div>
            </div>
          </div>
        </div>

        <div v-else-if="stores.length === 0" class="stores-empty">
          <p>Nenhuma loja disponível no momento.</p>
          <button class="primary-button" type="button" @click="navigateTo('/createUser?intent=store')">
            Criar minha loja agora
          </button>
        </div>

        <div v-else class="stores-grid">
          <article
            v-for="store in stores"
            :key="store._id"
            class="store-card"
            @click="navigateTo(`/${store.store}`)"
          >
            <div
              class="store-card__banner"
              :style="{
                backgroundColor: store.color || '#7A1F2E',
                backgroundImage: store.image ? `url(${store.image})` : 'none',
              }"
            >
              <span v-if="!store.image" class="store-card__badge">
                {{ (store.name || store.store).charAt(0).toUpperCase() }}
              </span>
            </div>
            <div class="store-card__body">
              <div class="store-card__header">
                <h3 class="store-card__title">{{ store.name || store.store }}</h3>
                <span class="store-card__slug">@{{ store.store }}</span>
              </div>
              <p class="store-card__desc">
                {{ store.description || 'Visite a vitrine para conhecer todos os produtos disponíveis.' }}
              </p>
              <div class="store-card__footer">
                <span class="store-card__cta">
                  Conhecer loja <span class="arrow">→</span>
                </span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section id="como-funciona" class="steps-section">
        <div class="section-intro">
          <p class="eyebrow">Sem complicação</p>
          <h2>Do primeiro nome à primeira venda.</h2>
        </div>
        <div class="steps-grid">
          <article v-for="step in steps" :key="step.number" class="step-item">
            <span>{{ step.number }}</span>
            <h3>{{ step.title }}</h3>
            <p>{{ step.description }}</p>
          </article>
        </div>
      </section>

      <section id="loja-demo" class="demo-callout">
        <div>
          <p class="eyebrow">Loja demo</p>
          <h2>Veja como sua vitrine pode começar.</h2>
          <p>Escolha um nome, uma cor e conte ao mundo o que você faz.</p>
        </div>
        <button class="outline-button" type="button" @click="navigateTo('/createUser?intent=store')">
          Começar agora <span>↗</span>
        </button>
      </section>
    </main>

    <lof-footer />
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()

const { data: storesResponse, status: storesStatus } = await useAsyncData(
  'landing-stores',
  () => $fetch<any>('/api/store/listStores', { params: { limit: 12 } })
)

const stores = computed(() => storesResponse.value?.data || [])
const loadingStores = computed(() => storesStatus.value === 'pending')

const demoProducts = [
  { name: 'Bolsa Mini', price: 'R$ 89,90', color: 'linear-gradient(135deg, #d98c72, #9e4b47)' },
  { name: 'Caderno Terra', price: 'R$ 42,00', color: 'linear-gradient(135deg, #d8b875, #8d7650)' },
  { name: 'Caneca Alma', price: 'R$ 36,90', color: 'linear-gradient(135deg, #9fb4aa, #4c716b)' },
]

const steps = [
  { number: '01', title: 'Crie sua conta', description: 'Comece com seus dados e tenha seu espaço reservado.' },
  { number: '02', title: 'Dê forma à loja', description: 'Escolha o nome, a cor e a apresentação da sua vitrine.' },
  { number: '03', title: 'Publique e compartilhe', description: 'Sua loja ganha um endereço próprio para chegar aos clientes.' },
]
</script>

<style scoped>
.landing-page {
  min-height: 100vh;
  background: #f2ede6;
  color: #201c1a;
}

.landing-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  width: min(100% - 48px, 1240px);
  margin: 0 auto;
  padding: 22px 0;
}

.landing-brand,
.landing-login,
.landing-create {
  border: 0;
  cursor: pointer;
  font: inherit;
}

.landing-brand {
  padding: 0;
  color: #7a1f2e;
  background: transparent;
  font-family: 'Cormorant Garamond', serif;
  font-size: 2rem;
  font-weight: 600;
}

.landing-nav__links {
  display: flex;
  gap: 28px;
  margin-left: auto;
}

.landing-nav__links a {
  color: #635b56;
  font-size: 0.85rem;
  text-decoration: none;
}

.landing-nav__links a:hover {
  color: #7a1f2e;
}

.landing-nav__actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.landing-login {
  padding: 10px 0;
  color: #7a1f2e;
  background: transparent;
  font-weight: 700;
}

.landing-create {
  padding: 11px 16px;
  color: #fff;
  background: #7a1f2e;
  font-weight: 700;
}

.landing-hero {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(360px, 1.1fr);
  align-items: center;
  gap: clamp(32px, 7vw, 112px);
  width: min(100% - 48px, 1240px);
  min-height: 680px;
  margin: 0 auto;
  padding: 72px 0 88px;
}

.eyebrow {
  margin: 0 0 14px;
  color: #7a1f2e;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hero-copy h1 {
  max-width: 600px;
  margin: 0;
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(3.5rem, 7vw, 6.8rem);
  font-weight: 600;
  line-height: 0.86;
}

.hero-description {
  max-width: 440px;
  margin: 28px 0 0;
  color: #635b56;
  font-size: 1.05rem;
  line-height: 1.65;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 22px;
  margin-top: 32px;
}

.primary-button,
.outline-button {
  border: 0;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
}

.primary-button {
  padding: 15px 22px;
  color: #fff;
  background: #7a1f2e;
}

.text-button {
  border: 0;
  padding: 0;
  color: #7a1f2e;
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
}

.text-button span,
.outline-button span {
  margin-left: 5px;
  font-size: 1.2em;
}

.demo-window {
  min-height: 430px;
  overflow: hidden;
  border: 1px solid rgba(32, 28, 26, 0.15);
  background: #fbf7f1;
  box-shadow: 24px 24px 0 #ded3c9;
  transform: rotate(2deg);
}

.demo-window__bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 14px 16px;
  border-bottom: 1px solid #e3d9d0;
}

.demo-window__bar span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d98c72;
}

.demo-window__bar span:nth-child(2) { background: #d8b875; }
.demo-window__bar span:nth-child(3) { background: #9fb4aa; }

.demo-window__bar small {
  margin-left: auto;
  color: #948981;
  font-size: 0.68rem;
}

.demo-store-head {
  padding: 42px 32px 35px;
  color: #fff;
  background: linear-gradient(135deg, #7a1f2e, #b8565b);
}

.demo-store-head p {
  margin: 0 0 14px;
  font-size: 0.7rem;
  letter-spacing: 0.16em;
}

.demo-store-head strong {
  display: block;
  max-width: 350px;
  font-family: 'Cormorant Garamond', serif;
  font-size: 2.55rem;
  font-weight: 600;
  line-height: 0.95;
}

.demo-products {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 24px 24px 18px;
}

.demo-product {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 0.72rem;
}

.demo-product__image {
  aspect-ratio: 0.8;
  margin-bottom: 5px;
}

.demo-product strong { font-size: 0.75rem; }

.demo-window__footer {
  padding: 8px 24px 22px;
  color: #948981;
  font-size: 0.7rem;
}

/* ===== SEÇÃO EXPLORAR LOJAS ===== */
.stores-section {
  padding: 88px max(24px, calc((100% - 1240px) / 2)) 96px;
  background: #fbf7f1;
  border-top: 1px solid rgba(32, 28, 26, 0.08);
}

.stores-intro-desc {
  max-width: 520px;
  margin: 18px 0 0;
  color: #635b56;
  font-size: 1.05rem;
  line-height: 1.6;
}

.stores-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 28px;
  margin-top: 48px;
}

.store-card {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid rgba(32, 28, 26, 0.09);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.store-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 32px rgba(122, 31, 46, 0.08);
  border-color: rgba(122, 31, 46, 0.35);
}

.store-card__banner {
  height: 130px;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.store-card__badge {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(4px);
  color: #ffffff;
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid rgba(255, 255, 255, 0.45);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.store-card__body {
  padding: 22px 24px 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.store-card__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.store-card__title {
  margin: 0;
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.55rem;
  font-weight: 600;
  line-height: 1.15;
  color: #201c1a;
}

.store-card__slug {
  font-size: 0.78rem;
  color: #7a1f2e;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.store-card__desc {
  margin: 12px 0 20px;
  color: #756c66;
  font-size: 0.9rem;
  line-height: 1.55;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.store-card__footer {
  border-top: 1px solid #f0e8e0;
  padding-top: 14px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.store-card__cta {
  color: #7a1f2e;
  font-size: 0.85rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: gap 0.2s ease;
}

.store-card:hover .store-card__cta {
  gap: 10px;
}

.stores-empty {
  margin-top: 48px;
  padding: 48px 24px;
  text-align: center;
  background: #ffffff;
  border: 1px dashed rgba(32, 28, 26, 0.2);
  border-radius: 8px;
}

.stores-empty p {
  margin: 0 0 20px;
  color: #756c66;
  font-size: 1rem;
}

.store-card--skeleton .store-card__banner {
  background: #ece4db;
}

.skeleton-shimmer {
  background: linear-gradient(90deg, #ece4db 25%, #f5eee5 50%, #ece4db 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-line {
  background: #ece4db;
  border-radius: 4px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.steps-section {
  padding: 92px max(24px, calc((100% - 1240px) / 2)) 104px;
  background: #f2ede6;
  border-top: 1px solid rgba(32, 28, 26, 0.08);
}

.section-intro h2,
.demo-callout h2 {
  max-width: 520px;
  margin: 0;
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(2.6rem, 5vw, 4.6rem);
  font-weight: 600;
  line-height: 0.92;
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 36px;
  margin-top: 64px;
}

.step-item {
  padding-top: 18px;
  border-top: 1px solid #cfc4ba;
}

.step-item span {
  color: #7a1f2e;
  font-size: 0.8rem;
  font-weight: 700;
}

.step-item h3 {
  margin: 44px 0 10px;
  font-size: 1.2rem;
}

.step-item p {
  max-width: 250px;
  margin: 0;
  color: #756c66;
  line-height: 1.55;
}

.demo-callout {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  padding: 100px max(24px, calc((100% - 1240px) / 2));
  color: #fff;
  background: #7a1f2e;
}

.demo-callout .eyebrow { color: #edc7bd; }
.demo-callout h2 { margin-bottom: 18px; }

.demo-callout p:not(.eyebrow) {
  margin: 0;
  color: #edc7bd;
}

.outline-button {
  flex-shrink: 0;
  padding: 14px 20px;
  color: #fff;
  border: 1px solid #edc7bd;
  background: transparent;
}

@media (max-width: 800px) {
  .landing-nav__links { display: none; }

  .landing-hero {
    grid-template-columns: 1fr;
    min-height: auto;
    padding: 64px 0 80px;
  }

  .demo-window {
    width: calc(100% - 24px);
    margin: 0 auto;
  }

  .steps-grid { grid-template-columns: 1fr; gap: 28px; }
  .step-item h3 { margin-top: 22px; }
  .demo-callout { align-items: flex-start; flex-direction: column; }
}

@media (max-width: 520px) {
  .landing-nav {
    width: min(100% - 32px, 1240px);
  }

  .landing-nav__actions { gap: 10px; }
  .landing-login { display: none; }

  .landing-hero { width: min(100% - 32px, 1240px); }
  .hero-actions { align-items: flex-start; flex-direction: column; }
  .demo-window { transform: none; box-shadow: 12px 12px 0 #ded3c9; }
  .demo-store-head { padding: 32px 22px; }
  .demo-products { padding-inline: 16px; }
}
</style>
