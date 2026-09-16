<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-vue-next'
import { getPleromaCaptcha, registerPleromaAccount, verifyPleromaConnection } from '../api/pleroma'
import { useAuthStore } from '../stores/auth'

const username = ref('')
const fullname = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const showPassword = ref(false)
const agreement = ref(false)
const loading = ref(false)
const error = ref('')
const notice = ref('')
const captcha = ref<any>(null)
const captchaSolution = ref('')
const captchaLoading = ref(false)
const captchaError = ref('')
const router = useRouter()
const auth = useAuthStore()

onMounted(loadCaptcha)

async function loadCaptcha() {
  captchaError.value = ''
  captchaSolution.value = ''
  captcha.value = null
  captchaLoading.value = true
  try {
    const result = await getPleromaCaptcha()
    captcha.value = result.captcha
  } catch (e) {
    captchaError.value = e instanceof Error ? e.message : 'Não foi possível carregar o CAPTCHA.'
  } finally {
    captchaLoading.value = false
  }
}

async function submit() {
  error.value = ''
  notice.value = ''
  if (password.value !== passwordConfirmation.value) {
    error.value = 'As senhas não conferem.'
    return
  }
  if (!agreement.value) {
    error.value = 'Você precisa concordar com as regras e políticas da instância.'
    return
  }
  if (!captcha.value?.token) {
    error.value = 'Carregue o CAPTCHA antes de criar a conta.'
    await loadCaptcha()
    return
  }
  if (!captchaSolution.value.trim()) {
    error.value = 'Informe a solução do CAPTCHA.'
    return
  }
  if (!captcha.value?.answer_data) {
    error.value = 'A instância não forneceu os dados do CAPTCHA necessários para concluir o cadastro. Gere um novo CAPTCHA.'
    return
  }
  loading.value = true
  try {
    const config = await registerPleromaAccount({
      username: username.value,
      fullname: fullname.value,
      email: email.value,
      password: password.value,
      captchaSolution: captchaSolution.value,
      captchaToken: captcha.value.token,
      captchaAnswerData: captcha.value.answer_data,
    })
    try {
      const { account } = await verifyPleromaConnection(config)
      auth.setAuthenticatedAccount(account, config.instanceUrl)
      await router.replace('/feed')
    } catch {
      notice.value = 'Conta criada. Se a instância exigir confirmação por e-mail, confirme o endereço e depois entre normalmente.'
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Não foi possível criar a conta.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="center" style="max-width:620px">
      <div class="card">
        <div class="eyebrow">Cadastro</div>
        <h1 style="font-size:34px">Criar conta no REA.fed</h1>
        <p class="lead" style="font-size:14px">Sua conta será criada diretamente na instância configurada pelo administrador. O REA.fed não cria uma conta paralela.</p>

        <form @submit.prevent="submit">
          <div class="field auth-field-wide"><label for="register-username">Nome de usuário</label><div class="input-icon-wrap"><UserRound :size="18"/><input id="register-username" class="input" v-model="username" name="username" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="seu_usuario" required /></div></div>
          <div class="field"><label>Nome completo</label><input class="input" v-model="fullname" type="text" autocomplete="name" placeholder="Seu nome" /></div>
          <div class="field"><label>E-mail</label><div class="input-icon-wrap"><Mail :size="16"/><input class="input" v-model="email" type="email" autocomplete="email" placeholder="voce@exemplo.com" required /></div></div>
          <div class="form-grid">
            <div class="field"><label>Senha</label><div class="input-icon-wrap"><LockKeyhole :size="16"/><input class="input" v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" required /><button class="input-action" type="button" @click="showPassword = !showPassword"><EyeOff v-if="showPassword" :size="16"/><Eye v-else :size="16"/></button></div></div>
            <div class="field"><label>Confirmar senha</label><div class="input-icon-wrap"><LockKeyhole :size="16"/><input class="input" v-model="passwordConfirmation" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" required /></div></div>
          </div>

          <div class="field">
            <label>CAPTCHA</label>
            <div v-if="captcha?.url" class="captcha-box">
              <img class="captcha-image" :src="captcha.url" alt="CAPTCHA da instância" />
              <div class="captcha-row">
                <input class="input" v-model="captchaSolution" type="text" autocomplete="off" placeholder="Digite o texto da imagem" />
                <button class="btn ghost" type="button" @click="loadCaptcha" :disabled="captchaLoading">{{ captchaLoading ? 'Carregando…' : 'Novo CAPTCHA' }}</button>
              </div>
              <p class="form-hint">O CAPTCHA é fornecido pela própria instância. O REA.fed envia a solução, o token e os dados criptografados exigidos pela API, sem armazenar sua senha.</p>
            </div>
            <div v-else class="captcha-empty">
              <span>{{ captchaLoading ? 'Carregando CAPTCHA…' : 'O cadastro desta instância exige CAPTCHA.' }}</span>
              <button class="btn ghost" type="button" @click="loadCaptcha" :disabled="captchaLoading">Carregar CAPTCHA</button>
            </div>
            <div v-if="captchaError" class="status bad"><p>{{ captchaError }}</p></div>
          </div>

          <label class="check-box"><input v-model="agreement" type="checkbox" /> <span>Concordo com as regras, termos e políticas da instância Pleroma.</span></label>
          <div v-if="error" class="status bad"><strong>Não foi possível criar a conta</strong><p>{{ error }}</p></div>
          <div v-if="notice" class="status good"><strong>Conta criada</strong><p>{{ notice }}</p></div>
          <button class="btn primary" style="width:100%;margin-top:16px" :disabled="loading">{{ loading ? 'Criando conta…' : 'Criar conta' }}</button>
        </form>

        <div class="auth-divider"><span>já tenho uma conta</span></div>
        <RouterLink class="btn ghost" style="width:100%" to="/login">Entrar</RouterLink>
        <p class="form-hint">A instância é definida pelo administrador no arquivo <code>.env</code>. A disponibilidade do cadastro depende da configuração da instância. Em caso de erro, a tela mostra agora o status e a resposta original da API, em vez de converter tudo para uma mensagem genérica.</p>
      </div>
    </div>
  </div>
</template>
