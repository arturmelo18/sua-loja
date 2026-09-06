<template>
  <div class="recovery-page">
    <main class="recovery-card">
      <button class="brand" type="button" @click="navigateTo('/')">Sua Loja</button>
      <p class="eyebrow">Recuperar acesso</p>
      <h1>Esqueceu sua senha?</h1>
      <p class="intro">Informe seu e-mail e enviaremos um código para você criar uma nova senha.</p>

      <form v-if="!sent" @submit.prevent="requestCode">
        <label class="field">
          <span>E-mail</span>
          <input v-model="email" type="email" autocomplete="email" placeholder="voce@email.com" required>
        </label>
        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
        <button class="primary-button" type="submit" :disabled="isLoading">
          {{ isLoading ? 'Enviando...' : 'Enviar código' }}
        </button>
      </form>

      <div v-else class="sent-state">
        <div class="sent-icon">✓</div>
        <h2>Confira seu e-mail</h2>
        <p>Se houver uma conta para este endereço, enviamos um código de recuperação.</p>
        <button class="primary-button" type="button" @click="navigateTo({ path: '/resetPassword', query: { email } })">
          Digitar código
        </button>
      </div>

      <nuxt-link class="back-link" to="/loginPage">Voltar para o login</nuxt-link>
    </main>
  </div>
</template>

<script setup lang="ts">
const email = ref('')
const isLoading = ref(false)
const sent = ref(false)
const errorMessage = ref('')

async function requestCode() {
  errorMessage.value = ''
  isLoading.value = true

  try {
    await $fetch('/api/user/requestPasswordRecovery', {
      method: 'POST',
      body: { email: email.value },
    })
    sent.value = true
  } catch (error: any) {
    errorMessage.value = error.data?.statusMessage || 'Não foi possível enviar o código.'
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
.intro, .sent-state p { color: #756c66; line-height: 1.55; }
.field { display: flex; flex-direction: column; gap: 7px; margin: 28px 0 16px; color: #4b4541; font-size: .78rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
.field input { padding: 13px; border: 1px solid #c9c0b7; background: #fff; color: #241f1d; font: inherit; letter-spacing: 0; text-transform: none; }
.primary-button { width: 100%; padding: 14px; border: 0; color: #fff; background: #7a1f2e; cursor: pointer; font: inherit; font-weight: 700; }
.primary-button:disabled { cursor: wait; opacity: .6; }
.error { color: #a12b37; font-size: .86rem; }
.sent-state { margin-top: 28px; text-align: center; }
.sent-icon { display: grid; place-items: center; width: 48px; height: 48px; margin: 0 auto 16px; border-radius: 50%; color: #fff; background: #7a1f2e; font-size: 1.5rem; }
.sent-state h2 { margin: 0; font-family: 'Cormorant Garamond', serif; font-size: 2rem; }
.back-link { display: block; margin-top: 24px; color: #7a1f2e; text-align: center; text-decoration: none; font-size: .9rem; }
@media (max-width: 480px) { .recovery-card { padding: 30px 22px; } }
</style>
