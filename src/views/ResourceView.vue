<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ExternalLink, ShieldCheck, Download, LoaderCircle, CheckCircle2, AlertTriangle, X } from 'lucide-vue-next'
import { getResource } from '../api'
import { listMyPleromaResources } from '../api/resources'
import { verifyResourceIdentity, type IpfsVerificationResult } from '../api/ipfs'
import type { Resource } from '../types'

const route = useRoute()
const r = ref<Resource>()
const loading = ref(true)
const verifyingIdentity = ref(false)
const identityVerification = ref<IpfsVerificationResult>()
const identityError = ref('')

async function verifyIdentity() {
  if (!r.value?.ipfs?.cid || !r.value.ipfs.manifestUrl || !r.value.ipfs.signatureUrl) return

  const extractCid = (url: string) => {
    const match = url.match(/\/ipfs\/([^/?#]+)/)
    return match?.[1] || ''
  }
  const manifestCid = extractCid(r.value.ipfs.manifestUrl)
  const signatureCid = extractCid(r.value.ipfs.signatureUrl)
  const timestampCid = r.value.ipfs.timestampUrl ? extractCid(r.value.ipfs.timestampUrl) : undefined
  if (!manifestCid || !signatureCid) {
    identityError.value = 'As evidências criptográficas publicadas não possuem CIDs válidos.'
    return
  }

  verifyingIdentity.value = true
  identityError.value = ''
  identityVerification.value = undefined
  try {
    identityVerification.value = await verifyResourceIdentity({
      cid: r.value.ipfs.cid,
      manifestCid,
      signatureCid,
      ...(timestampCid ? { timestampCid } : {}),
      ...(r.value.authors[0]?.id ? { expectedSignerId: r.value.authors[0].id } : {}),
    })
  } catch (error) {
    identityError.value = error instanceof Error ? error.message : 'Não foi possível verificar a identidade IPFS.'
  } finally {
    verifyingIdentity.value = false
  }
}

onMounted(async () => {
  const id = String(route.params.id)
  try {
    r.value = await getResource(id)
    if (!r.value && id.startsWith('pleroma-')) {
      const resources = await listMyPleromaResources()
      r.value = resources.find(resource => resource.id === id)
    }
    // A identidade é verificável sem ação manual: quando o recurso contém as
    // evidências publicadas, a própria página faz a checagem ao carregar.
    if (r.value?.ipfs?.cid && r.value.ipfs.manifestUrl && r.value.ipfs.signatureUrl) {
      await verifyIdentity()
    }
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page" v-if="r">
    <div class="center">
      <div class="eyebrow">Recurso educacional aberto</div>
      <h1 style="font:600 42px 'Space Grotesk';margin:10px 0">{{ r.title }}</h1>
      <p class="lead" style="white-space:pre-line">{{ r.description }}</p>

      <div class="source" style="margin:25px 0">
        <div class="source-logo">{{ r.sourcePlatform.name.slice(0, 1) }}</div>
        <div><strong>{{ r.sourcePlatform.name }}</strong><div style="font-size:12px;color:#748079">Plataforma de origem · {{ r.authors.map(a => a.name).join(', ') }}</div></div>
        <a :href="r.originalUrl" target="_blank" rel="noopener noreferrer" style="margin-left:auto"><ExternalLink :size="17" /></a>
      </div>

      <div class="status ok">
        <strong>✓ Publicado na instância Pleroma</strong>
        <div style="font-size:13px;margin-top:5px">O recurso foi recuperado diretamente da publicação federada.</div>
      </div>

      <div class="detail-list">
        <div class="detail"><b>Arquivo</b>{{ r.fileName }}</div>
        <div class="detail"><b>Tamanho</b>{{ r.fileSize ? `${(r.fileSize / 1000000).toFixed(1)} MB` : 'Informado pela instância na publicação' }}</div>
        <div class="detail"><b>Licença</b>{{ r.license || 'Não informada' }}</div>
        <div class="detail"><b>Publicado</b>{{ r.publishedAt }}</div>
      </div>

      <div v-if="r.ipfs" class="card" style="margin-top:18px;background:#f8faf8">
        <div class="section-title-row">
          <div><h3 style="margin:0">Identidade IPFS</h3><p>O recurso possui uma identidade independente do anexo de mídia do Pleroma.</p></div>
          <ShieldCheck :size="21" />
        </div>
        <div class="detail-list">
          <div class="detail"><b>CID</b><a :href="r.ipfs.url" target="_blank" rel="noopener noreferrer">{{ r.ipfs.cid }}</a></div>
          <div class="detail"><b>SHA-256</b><span style="word-break:break-all">{{ r.ipfs.sha256 || 'Não informado' }}</span></div>
          <div v-if="r.ipfs.manifestUrl" class="detail"><b>Manifesto</b><a :href="r.ipfs.manifestUrl" target="_blank" rel="noopener noreferrer">Abrir evidência</a></div>
          <div v-if="r.ipfs.signatureUrl" class="detail"><b>Assinatura</b><a :href="r.ipfs.signatureUrl" target="_blank" rel="noopener noreferrer">Abrir evidência</a></div>
          <div v-if="r.ipfs.timestampUrl" class="detail"><b>Timestamp OTS</b><a :href="r.ipfs.timestampUrl" target="_blank" rel="noopener noreferrer">Abrir evidência</a></div>
        </div>

        <div class="identity-verify-panel">
          <div class="identity-verify-head">
            <div>
              <strong>Verificação automática</strong>
              <p>A checagem segue a cadeia: assinatura → OTS → CID → hash → autoria. Primeiro usa os arquivos salvos localmente; só consulta o IPFS quando uma evidência ainda não estiver em cache.</p>
            </div>
            <button class="btn secondary identity-verify-button" type="button" :disabled="verifyingIdentity || !r.ipfs.manifestUrl || !r.ipfs.signatureUrl" @click="verifyIdentity">
              <LoaderCircle v-if="verifyingIdentity" class="spin" :size="17" />
              <ShieldCheck v-else :size="17" />
              {{ verifyingIdentity ? 'Verificando…' : 'Verificar' }}
            </button>
          </div>

          <div v-if="identityError" class="identity-result identity-result-bad">
            <X :size="18" />
            <div><strong>Não foi possível verificar</strong><p>{{ identityError }}</p></div>
          </div>

          <div v-else-if="identityVerification" class="identity-result" :class="identityVerification.overall === 'verified' ? 'identity-result-ok' : identityVerification.overall === 'pending' ? 'identity-result-pending' : 'identity-result-bad'">
            <CheckCircle2 v-if="identityVerification.overall === 'verified'" :size="19" />
            <AlertTriangle v-else-if="identityVerification.overall === 'pending'" :size="19" />
            <X v-else :size="19" />
            <div>
              <strong>{{ identityVerification.overall === 'verified' ? 'Autenticidade confirmada' : identityVerification.overall === 'pending' ? 'Identidade confirmada, timestamp pendente' : 'Autenticidade não confirmada' }}</strong>
              <p>{{ identityVerification.signer?.acct ? `Assinado por ${identityVerification.signer.acct}.` : 'A identidade criptográfica foi localizada no manifesto.' }}</p>
              <small v-if="identityVerification.signatureError" style="display:block;margin-top:5px">{{ identityVerification.signatureError }}</small>
            </div>
          </div>

          <div v-if="identityVerification?.steps?.length" class="identity-checks identity-checks-steps">
            <div v-for="step in identityVerification.steps" :key="step.id" class="identity-step" :class="`identity-step-${step.status}`">
              <span class="identity-step-icon">
                <CheckCircle2 v-if="step.status === 'valid'" :size="16" />
                <AlertTriangle v-else-if="step.status === 'pending'" :size="16" />
                <X v-else :size="16" />
              </span>
              <span><b>{{ step.label }}</b><small>{{ step.detail }}</small></span>
            </div>
          </div>

          <div v-if="identityVerification?.source" class="identity-source">
            Recurso: <b>{{ identityVerification.source.resource === 'local-cache' ? 'cache local' : 'IPFS' }}</b> ·
            Manifesto: <b>{{ identityVerification.source.manifest === 'local-cache' ? 'cache local' : 'IPFS' }}</b> ·
            Assinatura: <b>{{ identityVerification.source.signature === 'local-cache' ? 'cache local' : 'IPFS' }}</b> ·
            Timestamp: <b>{{ identityVerification.source.timestamp === 'local-cache' ? 'cache local' : identityVerification.source.timestamp === 'not-published' ? 'não publicado' : 'IPFS' }}</b> ·
            Chave: <b>{{ identityVerification.source.publicKey === 'local-cache' ? 'cache local' : identityVerification.publicKeySource === 'ipfs-public-key' ? 'IPFS' : 'backend' }}</b>
          </div>
        </div>
      </div>

      <div class="actions">
        <a class="btn primary" :href="r.originalUrl" target="_blank" rel="noopener noreferrer"><Download :size="17" /> Abrir arquivo/publicação</a>
        <a class="btn ghost" :href="r.originalUrl" target="_blank" rel="noopener noreferrer"><ExternalLink :size="17" /> Ver no Pleroma</a>
        <button v-if="r.ipfs" class="btn ghost" type="button" @click="verifyIdentity"><ShieldCheck :size="17" /> Verificar identidade</button>
      </div>
    </div>
  </div>
  <div v-else-if="loading" class="page"><div class="center">Carregando recurso…</div></div>
  <div v-else class="page"><div class="center"><h2>Recurso não encontrado</h2><p>O recurso pode ter sido removido ou a sessão do Pleroma expirou.</p></div></div>
</template>
