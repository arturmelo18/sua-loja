<template>
  <div class="settings-page">
    <nav-bar />

    <main class="settings-shell">
      <header class="settings-header">
        <div>
          <p class="eyebrow">Sua loja</p>
          <h1>Configure seu espaço</h1>
          <p class="settings-intro">Defina a identidade da sua vitrine e publique quando estiver pronta.</p>
        </div>
        <button class="preview-button" type="button" :disabled="!storeForm.store" @click="previewStore">
          Ver vitrine
        </button>
      </header>

      <form class="settings-form" @submit.prevent="saveStore">
        <section class="form-section">
          <div class="section-heading">
            <span class="section-number">01</span>
            <div>
              <h2>Identidade</h2>
              <p>Como seus clientes encontrarão sua loja.</p>
            </div>
          </div>

          <div class="field-grid">
            <label class="field">
              <span>Nome da loja</span>
              <input v-model="storeForm.name" type="text" placeholder="Ex: Fatecano" required>
            </label>
            <label class="field">
              <span>Endereço da loja</span>
              <div class="slug-input">
                <span>/</span>
                <input v-model="storeForm.store" type="text" placeholder="fatecano" required>
              </div>
            </label>
          </div>

          <label class="field color-field">
            <span>Cor principal</span>
            <div class="color-control">
              <input v-model="storeForm.color" type="color" aria-label="Escolha a cor principal">
              <code>{{ storeForm.color }}</code>
            </div>
          </label>
        </section>

        <section class="form-section">
          <div class="section-heading">
            <span class="section-number">02</span>
            <div>
              <h2>Apresentação</h2>
              <p>Adicione os slides que aparecem no topo da sua vitrine.</p>
            </div>
          </div>

          <div v-for="(slide, index) in storeForm.slides" :key="index" class="slide-form">
            <div class="slide-label">
              <strong>Slide {{ String(index + 1).padStart(2, '0') }}</strong>
              <button v-if="storeForm.slides.length > 1" type="button" class="remove-button" @click="removeSlide(index)">
                Remover
              </button>
            </div>
            <div class="field-grid">
              <label class="field">
                <span>Título</span>
                <input v-model="slide.title" type="text" placeholder="Ex: Feito para você" required>
              </label>
              <label class="field">
                <span>Imagem</span>
                <input v-model="slide.image" type="url" placeholder="https://..." required>
              </label>
            </div>
            <label class="field">
              <span>Descrição</span>
              <textarea v-model="slide.description" rows="2" placeholder="Conte um pouco sobre esta coleção ou destaque."></textarea>
            </label>
          </div>

          <button type="button" class="add-slide" @click="addSlide">+ Adicionar slide</button>
        </section>

        <div class="form-actions">
          <span v-if="errorMessage" class="error-message">{{ errorMessage }}</span>
          <button class="save-button" type="submit" :disabled="isSaving">
            {{ isSaving ? 'Publicando...' : 'Salvar e publicar loja' }}
          </button>
        </div>
      </form>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { Store, StoreSlide } from '~/types/Store'

const authStore = useAuthStore()
const isSaving = ref(false)
const errorMessage = ref('')
const defaultColor = '#7A1F2E'

const storeForm = reactive({
  name: '',
  store: '',
  color: defaultColor,
  slides: [{ title: '', description: '', image: '' }] as StoreSlide[],
})

async function loadStore() {
  const ownerId = authStore.user?._id
  if (!ownerId) return

  const savedStore = await $fetch<Store | null>('/api/store/getStore', {
    params: { ownerId },
  })

  if (savedStore) {
    storeForm.name = savedStore.name
    storeForm.store = savedStore.store
    storeForm.color = savedStore.color || defaultColor
    storeForm.slides = savedStore.slides.length ? savedStore.slides : storeForm.slides
  }
}

function addSlide() {
  storeForm.slides.push({ title: '', description: '', image: '' })
}

function removeSlide(index: number) {
  storeForm.slides.splice(index, 1)
}

async function saveStore() {
  const ownerId = authStore.user?._id
  errorMessage.value = ''

  if (!ownerId) {
    errorMessage.value = 'Sua sessão expirou. Entre novamente para continuar.'
    return
  }

  isSaving.value = true

  try {
    const savedStore = await $fetch<Store>('/api/store/updateStore', {
      method: 'PUT',
      body: {
        ownerId,
        name: storeForm.name,
        store: storeForm.store,
        color: storeForm.color,
        slides: storeForm.slides,
      },
    })

    await navigateTo(`/${savedStore.store}`)
  } catch (error: any) {
    errorMessage.value = error.data?.statusMessage || 'Não foi possível publicar sua loja.'
  } finally {
    isSaving.value = false
  }
}

function previewStore() {
  navigateTo(`/${storeForm.store}`)
}

definePageMeta({ middleware: 'auth' })

onMounted(loadStore)
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: #f2ede6;
  color: #1a1a1a;
}

.settings-shell {
  width: min(100% - 32px, 960px);
  margin: 0 auto;
  padding: 48px 0 72px;
}

.settings-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 36px;
}

.eyebrow,
.section-number {
  color: #7a1f2e;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.settings-header h1 {
  margin: 6px 0 8px;
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 600;
  line-height: 0.95;
}

.settings-intro,
.section-heading p {
  margin: 0;
  color: #6b6b6b;
}

.preview-button,
.save-button,
.add-slide,
.remove-button {
  border: 0;
  cursor: pointer;
  font: inherit;
}

.preview-button {
  padding: 12px 18px;
  border: 1px solid #7a1f2e;
  color: #7a1f2e;
  background: transparent;
}

.settings-form {
  border-top: 1px solid rgba(26, 26, 26, 0.18);
}

.form-section {
  padding: 32px 0;
  border-bottom: 1px solid rgba(26, 26, 26, 0.18);
}

.section-heading {
  display: flex;
  gap: 18px;
  align-items: flex-start;
  margin-bottom: 24px;
}

.section-heading h2 {
  margin: 0 0 4px;
  font-size: 1.35rem;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-bottom: 16px;
  color: #4b4b4b;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.field input,
.field textarea {
  width: 100%;
  border: 1px solid #c9c0b7;
  border-radius: 0;
  background: #fffaf5;
  color: #1a1a1a;
  font: inherit;
  font-size: 0.95rem;
  font-weight: 400;
  letter-spacing: 0;
  padding: 12px 13px;
  text-transform: none;
}

.field textarea {
  resize: vertical;
}

.field input:focus,
.field textarea:focus {
  outline: 2px solid rgba(122, 31, 46, 0.22);
  border-color: #7a1f2e;
}

.slug-input {
  display: flex;
  align-items: center;
  border: 1px solid #c9c0b7;
  background: #fffaf5;
  color: #7a1f2e;
}

.slug-input span {
  padding-left: 13px;
}

.slug-input input {
  border: 0;
  background: transparent;
}

.color-field {
  width: 180px;
}

.color-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-control input {
  width: 48px;
  height: 38px;
  padding: 2px;
  cursor: pointer;
}

.color-control code {
  font-size: 0.85rem;
  font-weight: 400;
  letter-spacing: 0;
  text-transform: uppercase;
}

.slide-form {
  padding: 18px;
  margin-bottom: 16px;
  background: rgba(255, 250, 245, 0.7);
  border: 1px solid #d5ccc3;
}

.slide-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 14px;
}

.remove-button {
  color: #7a1f2e;
  background: transparent;
  font-size: 0.78rem;
}

.add-slide {
  padding: 10px 14px;
  border: 1px dashed #7a1f2e;
  color: #7a1f2e;
  background: transparent;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 18px;
  padding-top: 24px;
}

.error-message {
  color: #a12b37;
  font-size: 0.9rem;
}

.save-button {
  padding: 14px 20px;
  color: #fff;
  background: #7a1f2e;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

@media (max-width: 640px) {
  .settings-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .field-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .form-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .save-button {
    width: 100%;
  }
}
</style>
