<script setup lang="ts">
import { computed, ref } from 'vue'
import { verifyResource } from '../api'
import type { VerificationStatus } from '../types'
import { ShieldCheck, Upload, AlertTriangle, X, FileCheck2, FileSignature, Clock3, CheckCircle2 } from 'lucide-vue-next'

const file = ref<File>()
const manifest = ref<File>()
const signature = ref<File>()
const ots = ref<File>()
const result = ref<VerificationStatus>()
const loading = ref(false)
const error = ref('')

function pick(target: 'file' | 'manifest' | 'signature' | 'ots', event: Event) {
  const selected = (event.target as HTMLInputElement).files?.[0]
  if (!selected) return
  if (target === 'file') file.value = selected
  if (target === 'manifest') manifest.value = selected
  if (target === 'signature') signature.value = selected
  if (target === 'ots') ots.value = selected
  result.value = undefined
  error.value = ''
}

function clear(target: 'file' | 'manifest' | 'signature' | 'ots') {
  if (target === 'file') file.value = undefined
  if (target === 'manifest') manifest.value = undefined
  if (target === 'signature') signature.value = undefined
  if (target === 'ots') ots.value = undefined
  result.value = undefined
}

const evidenceCount = computed(() => [manifest.value, signature.value, ots.value].filter(Boolean).length)
const canVerify = computed(() => Boolean(file.value && manifest.value && signature.value && ots.value))

async function verify() {
  if (!file.value || !manifest.value || !signature.value || !ots.value) return
  loading.value = true
  result.value = undefined
  error.value = ''
  try {
    result.value = await verifyResource(file.value, {
      manifest: manifest.value,
      signature: signature.value,
      ots: ots.value,
    })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Não foi possível concluir a verificação.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="center verify-page">
      <div class="eyebrow">Verificação pública</div>
      <h1>Comprove a autenticidade de um recurso</h1>
      <p class="lead">
        Para verificar a autoria, não basta enviar somente o arquivo original. Envie também as evidências
        fornecidas pela plataforma de origem: <strong>manifest.js</strong>, <strong>.sig</strong> e <strong>.ots</strong>.
      </p>

      <div class="verification-explainer">
        <div class="explainer-icon"><ShieldCheck :size="22" /></div>
        <div>
          <strong>O que será verificado?</strong>
          <p>O arquivo será comparado ao manifesto, a assinatura será validada e a evidência temporal será conferida pela API externa.</p>
        </div>
      </div>

      <div class="card verify-card">
        <div class="section-title-row">
          <div>
            <h2>1. Arquivo original</h2>
            <p>Envie exatamente o arquivo que deseja autenticar.</p>
          </div>
          <span class="required-badge">Obrigatório</span>
        </div>

        <label class="dropzone dropzone-primary" :class="{ selected: file }">
          <input type="file" @change="pick('file', $event)" />
          <div class="dropzone-content">
            <div class="upload-icon"><Upload :size="25" /></div>
            <strong>{{ file?.name || 'Escolha um arquivo ou arraste aqui' }}</strong>
            <small>{{ file ? `${(file.size / 1000000).toFixed(2)} MB` : 'PDF, documento, apresentação ou outro recurso publicado' }}</small>
          </div>
        </label>
        <button v-if="file" class="remove-file" type="button" @click="clear('file')">Remover arquivo</button>

        <div class="section-title-row evidence-heading">
          <div>
            <h2>2. Evidências de autoria</h2>
            <p>Envie os arquivos que acompanham o recurso publicado.</p>
          </div>
          <span class="evidence-counter">{{ evidenceCount }}/3 selecionados</span>
        </div>

        <div class="evidence-upload-grid">
          <label class="evidence-dropzone" :class="{ selected: manifest }">
            <input type="file" accept=".js,.json" @change="pick('manifest', $event)" />
            <FileCheck2 :size="24" />
            <span class="evidence-type">MANIFESTO</span>
            <strong>{{ manifest?.name || 'manifest.js' }}</strong>
            <small>{{ manifest ? 'Arquivo selecionado' : 'Arraste ou clique para selecionar' }}</small>
          </label>

          <label class="evidence-dropzone" :class="{ selected: signature }">
            <input type="file" accept=".sig" @change="pick('signature', $event)" />
            <FileSignature :size="24" />
            <span class="evidence-type">ASSINATURA</span>
            <strong>{{ signature?.name || 'arquivo.sig' }}</strong>
            <small>{{ signature ? 'Arquivo selecionado' : 'Arraste ou clique para selecionar' }}</small>
          </label>

          <label class="evidence-dropzone" :class="{ selected: ots }">
            <input type="file" accept=".ots" @change="pick('ots', $event)" />
            <Clock3 :size="24" />
            <span class="evidence-type">TIMESTAMP</span>
            <strong>{{ ots?.name || 'arquivo.ots' }}</strong>
            <small>{{ ots ? 'Arquivo selecionado' : 'Arraste ou clique para selecionar' }}</small>
          </label>
        </div>

        <div class="verification-note">
          <CheckCircle2 :size="17" />
          <span>Esses arquivos devem ter sido obtidos da plataforma que publicou originalmente o recurso.</span>
        </div>

        <div class="actions verify-actions">
          <button class="btn primary verify-button" :disabled="!canVerify || loading" @click="verify">
            <ShieldCheck :size="18" />
            {{ loading ? 'Verificando evidências…' : 'Verificar autoria e integridade' }}
          </button>
        </div>
        <p v-if="!canVerify && !loading" class="form-hint">Selecione o arquivo original e as três evidências para habilitar a verificação.</p>
      </div>

      <div v-if="loading" class="card processing-card">
        <div class="processing-title"><span class="spinner"></span><strong>Verificando o recurso</strong></div>
        <p>A API externa está comparando o arquivo com as evidências fornecidas.</p>
        <div class="progress"><i></i></div>
      </div>

      <div v-if="error" class="card error-card">
        <div class="status bad"><strong><X :size="18" /> Não foi possível verificar</strong><p>{{ error }}</p></div>
      </div>

      <div v-if="result" class="card result-card">
        <div v-if="result.overall === 'verified'" class="status ok">
          <strong><ShieldCheck :size="18" /> Arquivo autêntico</strong>
          <p>Integridade, assinatura, autoria e evidência temporal foram confirmadas pela API.</p>
        </div>
        <div v-else-if="result.overall === 'altered'" class="status warn">
          <strong><AlertTriangle :size="18" /> Arquivo não corresponde à evidência</strong>
          <p>{{ result.details[0] }}</p>
        </div>
        <div v-else class="status bad">
          <strong><X :size="18" /> Verificação não confirmada</strong>
          <p>{{ result.details[0] }}</p>
        </div>

        <div class="detail-list">
          <div class="detail"><b>Integridade</b>{{ result.integrity ? '✓ Confirmada' : '✕ Não confirmada' }}</div>
          <div class="detail"><b>Assinatura</b>{{ result.signature ? '✓ Válida' : '✕ Inválida' }}</div>
          <div class="detail"><b>Autoria</b>{{ result.authorship ? '✓ Verificável' : '✕ Não verificada' }}</div>
          <div class="detail"><b>Evidência temporal</b>{{ result.timestamp ? '✓ Confirmada' : '✕ Não confirmada' }}</div>
        </div>

        <details style="margin-top:20px">
          <summary>Detalhes técnicos</summary>
          <ul><li v-for="d in result.details" :key="d">{{ d }}</li></ul>
        </details>
      </div>
    </div>
  </div>
</template>
