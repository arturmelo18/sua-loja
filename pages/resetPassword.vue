<template>
  <div class="recovery-page">
    <main class="recovery-card">
      <button class="brand" type="button" @click="navigateTo('/')">Sua Loja</button>
      <p class="eyebrow">Nova senha</p>
      <h1>Recupere sua conta.</h1>
      <p class="intro">Digite o código recebido por e-mail e escolha uma senha nova.</p>

      <form @submit.prevent="resetPassword">
        <label class="field">
          <span>E-mail</span>
          <input v-model="form.email" type="email" autocomplete="email" required>
        </label>
        <label class="field">
          <span>Código de recuperação</span>
          <input v-model="form.code" inputmode="numeric" maxlength="6" placeholder="000000" required>
        </label>
        <label class="field">
          <span>Nova senha</span>
          <input v-model="form.password" type="password" autocomplete="new-password" placeholder="Sua nova senha" required>
        </label>
        <p class="hint">Use pelo menos 8 caracteres, uma letra maiúscula e um caractere especial.</p>
        <p v-if="message" :class="isSuccess ? 'success' : 'error'">{{ message }}</p>
        <button class="primary-button" type="submit" :disabled="isLoading">
          {{ isLoading ? 'Salvando...' : 'Alterar senha' }}
        </button>
      </form>

      <nuxt-link class="back-link" to="/loginPage">Voltar para o login</nuxt-link>
    </main>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const form = reactive({
  email: typeof route.query.email === 'string' ? route.query.email : '',
  code: '',
  password: '',
})
const isLoading = ref(false)
const message = ref('')
const isSuccess = ref(false)

async function resetPassword() {
  message.value = ''
  isLoading.value = true

  try {
    await $fetch('/api/user/resetPassword', {
      method: 'POST',
      body: form,
    })
    isSuccess.value = true
    message.value = 'Senha alterada. Você já pode entrar na sua conta.'
    setTimeout(() => navigateTo('/loginPage'), 1200)
  } catch (error: any) {
    isSuccess.value = false
    message.value = error.data?.statusMessage || 'Não foi possível alterar a senha.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.recovery-page { min-height: 100vh; display: grid; place-items: center; padding: 24px; background: #f2ede6; color: #241f1d; }
.recovery-card { width: min(100%, 430px); padding: 42px; background: #fffaf5; border: 1px solid #d8cec5; box-shadow: 14px 14px 0 #ded3c9; }
.brand { border: 0; padding: 0; color: #7a1f2e; background: transparent; cursor: pointer; font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 600; }
.eyebrow { margin: 42px 0 10px; color: #7a1f2e; font-size: .72rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
h1 { margin: 0; font-family: 'Cormorant Garamond', serif; font-size: 3.4rem; font-weight: 600; line-height: .9; }
.intro { color: #756c66; line-height: 1.55; }
.field { display: flex; flex-direction: column; gap: 7px; margin: 20px 0 16px; color: #4b4541; font-size: .78rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
.field input { padding: 13px; border: 1px solid #c9c0b7; background: #fff; color: #241f1d; font: inherit; letter-spacing: 0; text-transform: none; }
.hint { color: #756c66; font-size: .8rem; line-height: 1.45; }
.primary-button { width: 100%; padding: 14px; border: 0; color: #fff; background: #7a1f2e; cursor: pointer; font: inherit; font-weight: 700; }
.primary-button:disabled { cursor: wait; opacity: .6; }
.error, .success { font-size: .86rem; }
.error { color: #a12b37; }
.success { color: #2d7a3a; }
.back-link { display: block; margin-top: 24px; color: #7a1f2e; text-align: center; text-decoration: none; font-size: .9rem; }
@media (max-width: 480px) { .recovery-card { padding: 30px 22px; } }
</style>
