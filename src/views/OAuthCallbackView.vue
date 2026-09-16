<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const error = ref('')

onMounted(async () => {
  const code = typeof route.query.code === 'string' ? route.query.code : ''
  const state = typeof route.query.state === 'string' ? route.query.state : ''
  const oauthError = typeof route.query.error === 'string' ? route.query.error : ''

  if (oauthError) {
    error.value = typeof route.query.error_description === 'string' ? route.query.error_description : oauthError
    return
  }

  if (!code || !state) {
    error.value = 'A resposta da instância não contém o código de autorização esperado.'
    return
  }

  try {
    await auth.completeLogin(code, state)
    await router.replace('/feed')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Não foi possível concluir o login.'
  }
})
</script>

<template>
  <div class="page">
    <div class="center" style="max-width:520px">
      <div class="card">
        <div v-if="!error">
          <div class="eyebrow">Autenticação</div>
          <h1>Conectando…</h1>
          <p class="lead" style="font-size:14px">Estamos concluindo a autorização da sua instância Pleroma.</p>
        </div>
        <div v-else>
          <div class="eyebrow">Autenticação</div>
          <h1>Não foi possível entrar</h1>
          <div class="status bad"><p>{{ error }}</p></div>
          <RouterLink class="btn primary" to="/login">Tentar novamente</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
