<template>
    <div class="page-wrapper" :style="{ '--store-color': storeColor }">
        <header class="custom-header">
            <div class="header-content">
                <h1>{{ state.isNew ? 'Novo Produto' : 'Editar Produto' }}</h1>
                <div class="header-actions">
                    <el-button class="btn-secondary" @click="navigateTo('/adminPage')">Cancelar</el-button>
                    <el-button class="btn-primary" :disabled="isLoading" @click="handleSave">
                        {{ isLoading ? 'Salvando...' : 'Salvar Produto' }}
                    </el-button>
                </div>
            </div>
        </header>
        
        <GradientDivisor />
        
        <main class="main-container">
            <section class="content-card">
                <div class="image-column">
                    <span class="column-title">Mídia do Produto</span>
                    <el-upload
                        class="avatar-uploader"
                        action="#" 
                        :show-file-list="false"
                        :auto-upload="false" 
                        :on-change="handleImageChange"
                    >
                        <div v-if="state.product.image" class="image-preview-container">
                            <img :src="state.product.image" class="avatar" alt="Preview do produto" />
                            <div class="avatar-overlay">
                                <el-icon><Plus /></el-icon>
                                <span>Alterar Imagem</span>
                            </div>
                        </div>
                        <div v-else class="uploader-placeholder">
                            <el-icon class="avatar-uploader-icon"><Plus /></el-icon>
                            <span class="upload-text">Clique para enviar uma foto</span>
                            <span class="upload-hint">Formatos aceitos: JPG, PNG (Máx 2MB)</span>
                        </div>
                    </el-upload>
                </div>

                <div class="form-column">
                    <span class="column-title">Informações Gerais</span>
                    
                    <div class="form-item">
                        <label for="product-name">Nome do produto</label>
                        <el-input id="product-name" placeholder="Ex: Caneca Manuel Gomes" v-model="state.product.name"/>
                    </div>

                    <div class="form-item">
                      <label for="product-category">Categoria</label>
                      <el-input id="product-category" placeholder="Ex: Camisa" v-model="state.product.category"/>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-item size-half">
                            <label for="product-price">Preço</label>
                            <el-input 
                                id="product-price" 
                                placeholder="0,00" 
                                v-model="displayPrice"
                            >
                                <template #prefix>
                                    <span class="input-currency-prefix">R$</span>
                                </template>
                            </el-input>
                        </div>
                        <div class="form-item size-half" v-if="!state.product.variants?.length">
                            <label for="product-quantity">Quantidade em estoque</label>
                            <el-input id="product-quantity" type="number" placeholder="Ex: 50" v-model="state.product.quantity"/>
                        </div>
                        <div class="form-item size-half" v-else>
                          <label>Estoque total</label>
                          <span class="total-quantity">{{ totalVariantQuantity }} unidades</span>
                        </div>
                    </div>

                      <div class="variants-section">
                        <div class="variants-heading">
                          <label>Variações / tamanhos</label>
                          <el-button size="small" @click="addVariant">+ Adicionar</el-button>
                        </div>
                        <div v-for="(variant, index) in state.product.variants || []" :key="index" class="variant-row">
                          <el-input v-model="variant.name" placeholder="Ex: M" />
                          <el-input v-model.number="variant.quantity" type="number" min="0" placeholder="Estoque" />
                          <el-button type="danger" text @click="removeVariant(index)">Remover</el-button>
                        </div>
                        <span class="field-hint">Use variações quando o produto tiver tamanhos, cores ou estoques separados.</span>
                      </div>
                    
                    <div class="form-item">
                        <label for="product-description">Descrição do produto</label> 
                        <el-input id="product-description" :rows="5" type="textarea" placeholder="Conte mais detalhes sobre os materiais, tamanho e diferenciais do produto..." v-model="state.product.description"/>
                    </div>
                    
                    <div class="form-item-horizontal">
                        <div class="label-with-help">
                            <label for="product-active">Disponibilidade</label>
                            <el-tooltip content="Habilita ou desabilita seu produto na vitrine da loja" placement="top">
                                <span class="help-icon">?</span>
                            </el-tooltip>
                        </div>
                        <div class="switch-container">
                            <span class="switch-status-text">{{ state.product.published ? 'Ativo na loja' : 'Oculto na loja' }}</span>
                            <el-switch id="product-active" v-model="state.product.published" :style="{ '--el-switch-on-color': storeColor }"/>
                        </div>
                    </div>
                </div>
            </section>
        </main>
        
        <LofFooter />
    </div>
</template>

<script lang="ts" setup>
import type { Product, ProductVariant } from "~/types/Product";
import { Plus } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import type { UploadFile } from "element-plus";

const route = useRoute();
const authStore = useAuthStore()
const { storeColor, loadStoreTheme } = useStoreTheme()
const isLoading = ref(false);
const selectedFile = ref<File | null>(null);

definePageMeta({
  middleware: 'auth',
})

const state = reactive({
  product: {
    name: "",
    price: 0,
    quantity: 1,
    description: "",
    image: "",
    published: true,
    category: "",
    variants: [] as ProductVariant[],
  } as unknown as Product,
  isNew: true,
});

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

onMounted(async () => {
  await loadStoreTheme({ ownerId: authStore.user?._id })
    if (!route.query._id) return
    state.isNew = false
    try {
        const result = await $fetch<Product>('/api/product/getProduct', {
            method: 'GET',
            params: { _id: route.query._id }
        })
        state.product = result
    } catch (error) {
        ElMessage.error('Erro ao carregar produto')
    }
})

const handleSave = async () => {
  if (!state.product.name || !state.product.price) {
    ElMessage.warning("Preencha os campos obrigatórios")
    return
  }

  isLoading.value = true
  try {
    if (selectedFile.value) {
      state.product.image = await fileToBase64(selectedFile.value)
    }

    const body = {
      ...state.product,
      quantity: state.product.variants?.length
        ? totalVariantQuantity.value
        : state.product.quantity,
      price: state.isNew
        ? Math.round(state.product.price * 100)   // novo: converte reais → centavos
        : state.product.price,                     // edição: já está em centavos
    }

    if (state.isNew) {
      await $fetch('/api/product/createProduct', { method: 'POST', body })
      ElMessage.success('Produto criado com sucesso!')
    } else {
      await $fetch('/api/product/updateProduct', { method: 'PUT', body })
      ElMessage.success('Produto atualizado com sucesso!')
    }

    navigateTo('/adminPage')
  } catch (e: any) {
    console.error(e)
    ElMessage.error(e.statusMessage || 'Erro ao salvar')
  } finally {
    isLoading.value = false
  }
}

const handleImageChange = (uploadFile: UploadFile) => {
  if (!uploadFile.raw) return;

  if (uploadFile.raw.size / 1024 / 1024 > 2) {
    ElMessage.error("A foto não pode passar de 2MB");
    return;
  }

  selectedFile.value = uploadFile.raw;
  state.product.image = URL.createObjectURL(uploadFile.raw);
};

const displayPrice = computed({
  get: () => state.isNew ? state.product.price : state.product.price / 100,
  set: (val) => { state.product.price = state.isNew ? val : val * 100 }
})

const totalVariantQuantity = computed(() =>
  (state.product.variants || []).reduce((total, variant) => total + (Number(variant.quantity) || 0), 0)
)

function addVariant() {
  if (!state.product.variants) state.product.variants = []
  state.product.variants.push({ name: '', quantity: 0 })
}

function removeVariant(index: number) {
  state.product.variants?.splice(index, 1)
}
</script>

<style lang="css" scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');

/* Correção de Layout: Sticky Footer Pattern usando Flexbox */
.page-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100vw;
  background-color: #F2EDE6;
  font-family: 'Plus Jakarta Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* Header alinhado milimetricamente */
.custom-header {
  background-color: #ffffff;
  padding: 1.25rem 0;
  border-bottom: 1px solid color-mix(in srgb, var(--store-color, #7A1F2E) 10%, transparent);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
}

.custom-header h1 {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 26px;
  font-weight: 600;
  color: var(--store-color, #7A1F2E);
  margin: 0;
  letter-spacing: -0.01em;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

/* Botões */
.btn-primary {
  background-color: var(--store-color, #7A1F2E) !important;
  border-color: var(--store-color, #7A1F2E) !important;
  color: #ffffff !important;
  font-weight: 500;
  border-radius: 6px;
  padding: 10px 20px;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background-color: color-mix(in srgb, var(--store-color, #7A1F2E) 82%, #000) !important;
  border-color: color-mix(in srgb, var(--store-color, #7A1F2E) 82%, #000) !important;
}

.btn-secondary {
  background-color: transparent !important;
  border-color: color-mix(in srgb, var(--store-color, #7A1F2E) 24%, transparent) !important;
  color: var(--store-color, #7A1F2E) !important;
  font-weight: 500;
  border-radius: 6px;
  padding: 10px 20px;
}

.btn-secondary:hover {
  background-color: color-mix(in srgb, var(--store-color, #7A1F2E) 5%, transparent) !important;
  border-color: var(--store-color, #7A1F2E) !important;
}

/* Alinhamento unificado do Grid */
.main-container {
  flex: 1; /* Força o footer para a base da página */
  width: 100%;
  max-width: 1200px;
  margin: 3rem auto;
  padding: 0 2rem;
  box-sizing: border-box;
}

.content-card {
  display: flex;
  gap: 3.5rem;
  background-color: #ffffff;
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0 10px 30px color-mix(in srgb, var(--store-color, #7A1F2E) 3%, transparent);
}

.image-column {
  flex: 0 0 35%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.column-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--store-color, #7A1F2E);
  margin-bottom: 0.5rem;
  display: block;
  border-bottom: 1px solid color-mix(in srgb, var(--store-color, #7A1F2E) 12%, transparent);
  padding-bottom: 0.5rem;
}

.form-row {
  display: flex;
  gap: 1.25rem;
}

.variants-section {
  padding: 1rem;
  border: 1px solid color-mix(in srgb, var(--store-color, #7A1F2E) 12%, transparent);
  background: color-mix(in srgb, var(--store-color, #7A1F2E) 3%, #fff);
}

.variants-heading,
.variant-row {
  display: flex;
  align-items: center;
  gap: .75rem;
}

.variants-heading {
  justify-content: space-between;
  margin-bottom: .75rem;
}

.variant-row {
  margin-bottom: .6rem;
}

.variant-row .el-input:first-child {
  flex: 1;
}

.variant-row .el-input:nth-child(2) {
  width: 150px;
}

.field-hint,
.total-quantity {
  color: #777;
  font-size: .78rem;
}

.size-half {
  flex: 1;
}

.form-item {
  display: flex;
  flex-direction: column;
}

.form-item label {
  margin-bottom: 0.5rem;
  color: #555555;
  font-size: 13px;
  font-weight: 500;
}

/* Customização dos Inputs Element Plus */
:deep(.el-input__wrapper), :deep(.el-textarea__inner) {
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08) inset !important;
  border-radius: 6px !important;
  padding: 10px 12px;
  background-color: #fcfbfa;
  transition: all 0.2s ease;
}

:deep(.el-input__wrapper.is-focus), :deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px var(--store-color, #7A1F2E) inset, 0 0 0 3px color-mix(in srgb, var(--store-color, #7A1F2E) 10%, transparent) !important;
  background-color: #ffffff;
}

/* Prefixo de Moeda Elegante */
.input-currency-prefix {
  color: #8c8c8c;
  font-size: 13px;
  font-weight: 500;
  padding-right: 4px;
}

/* Bloco de Disponibilidade Lapidado */
.form-item-horizontal {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fbf9f6;
  padding: 1.25rem;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--store-color, #7A1F2E) 10%, transparent); /* Removido o tracejado amador */
  margin-top: 0.5rem;
}

.label-with-help {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.label-with-help label {
  color: var(--store-color, #7A1F2E);
  font-size: 14px;
  font-weight: 600;
  margin: 0;
}

.help-icon {
  background-color: color-mix(in srgb, var(--store-color, #7A1F2E) 8%, transparent);
  color: var(--store-color, #7A1F2E);
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: help;
  font-size: 11px;
  font-weight: bold;
}

.switch-container {
  display: flex;
  align-items: center;
  gap: 1rem; /* Mais respiro para obedecer à Gestalt */
}

.switch-status-text {
  font-size: 13px;
  color: #666666;
}

/* Área de Upload */
.avatar-uploader :deep(.el-upload) {
  border: 1px dashed color-mix(in srgb, var(--store-color, #7A1F2E) 24%, transparent);
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 100%;
  padding-top: 100%;
  height: 0;
  background-color: #fbf9f6;
  transition: all 0.2s ease;
}

.avatar-uploader :deep(.el-upload:hover) {
  border-color: var(--store-color, #7A1F2E);
  background-color: color-mix(in srgb, var(--store-color, #7A1F2E) 2%, transparent);
}

.uploader-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  text-align: center;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: var(--store-color, #7A1F2E);
  margin-bottom: 0.75rem;
  opacity: 0.6;
}

.upload-text {
  font-size: 13px;
  font-weight: 500;
  color: var(--store-color, #7A1F2E);
  margin-bottom: 0.25rem;
}

.upload-hint {
  font-size: 11px;
  color: #8c8c8c;
}

.image-preview-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: color-mix(in srgb, var(--store-color, #7A1F2E) 65%, transparent);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s ease;
  font-size: 13px;
}

.image-preview-container:hover .avatar-overlay {
  opacity: 1;
}

/* Responsividade Adaptativa */
@media (max-width: 834px) {
  .main-container {
    padding: 0 1rem;
    margin: 1.5rem auto;
  }
  .header-content {
    padding: 0 1rem;
  }
  .content-card {
    flex-direction: column;
    gap: 2.5rem;
    padding: 2rem;
  }
  .image-column {
    flex: 0 0 100%;
  }
}

@media (max-width: 480px) {
  .form-row {
    flex-direction: column;
    gap: 1.5rem;
  }
}
</style>