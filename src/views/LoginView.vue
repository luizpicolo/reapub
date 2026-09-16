<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-vue-next'
import { loginWithPleromaPassword, verifyPleromaConnection } from '../api/pleroma'
import { useAuthStore } from '../stores/auth'

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')
const router = useRouter()
const auth = useAuthStore()

async function submit() {
  error.value = ''
  if (!username.value.trim() || !password.value) return
  loading.value = true
  try {
    const config = await loginWithPleromaPassword(username.value, password.value)
    const { account } = await verifyPleromaConnection(config)
    auth.setAuthenticatedAccount(account, config.instanceUrl)
    await router.replace('/feed')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Não foi possível entrar.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="center" style="max-width:520px">
      <div class="card">
        <div class="eyebrow">Acessar sua conta</div>
        <h1 style="font-size:34px">Entrar no REA.fed</h1>
        <p class="lead" style="font-size:14px">
          Use a conta da sua instância Pleroma. O REA.fed autentica diretamente na instância e não guarda sua senha.
        </p>

        <form @submit.prevent="submit">
          <div class="field">
            <label>Usuário</label>
            <div class="input-icon-wrap"><UserRound :size="16"/><input class="input" v-model="username" type="text" autocomplete="username" placeholder="seu_usuario" required /></div>
          </div>
          <div class="field">
            <label>Senha</label>
            <div class="input-icon-wrap"><LockKeyhole :size="16"/><input class="input" v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" placeholder="Sua senha" required /><button class="input-action" type="button" @click="showPassword = !showPassword" :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"><EyeOff v-if="showPassword" :size="16"/><Eye v-else :size="16"/></button></div>
          </div>

          <div v-if="error" class="status bad"><strong>Não foi possível entrar</strong><p>{{ error }}</p></div>

          <button class="btn primary" style="width:100%;margin-top:8px" :disabled="loading">
            {{ loading ? 'Autenticando…' : 'Entrar' }}
          </button>
        </form>

        <div class="auth-divider"><span>ou</span></div>
        <RouterLink class="btn secondary" style="width:100%" to="/register">Criar uma conta</RouterLink>
        <p class="form-hint">A instância é definida pelo administrador no arquivo <code>.env</code>. A senha é enviada diretamente para essa instância usando HTTPS. O REA.fed mantém apenas o token de sessão retornado pelo Pleroma. Em caso de erro, a tela mostra agora o status e a resposta original da API para facilitar o diagnóstico.</p>
      </div>
    </div>
  </div>
</template>
