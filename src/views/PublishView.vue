<script setup lang="ts">
import { ref } from 'vue'
import { ExternalLink, FileCheck, Send, ShieldCheck, Upload } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { loadPleromaConfig, publishResourceToPleroma } from '../api/pleroma'
import { uploadResourceToIpfs, type IpfsUploadResult } from '../api/ipfs'
import { useAuthStore } from '../stores/auth'
import type { Resource } from '../types'

const auth = useAuthStore()
const config = loadPleromaConfig()
const file = ref<File>()
const title = ref('')
const description = ref('')
const area = ref('')
const type = ref('Apostila')
const license = ref('CC BY 4.0')
const tags = ref('')
const visibility = ref<'public' | 'unlisted' | 'private' | 'direct'>('public')
const loading = ref(false)
const published = ref<(Resource & { status: { url?: string; id: string } })>()
const ipfs = ref<IpfsUploadResult>()
const error = ref('')
const stage = ref<'idle' | 'ipfs' | 'pleroma'>('idle')

function pick(e: Event) {
  file.value = (e.target as HTMLInputElement).files?.[0]
  published.value = undefined
  ipfs.value = undefined
  error.value = ''
}

async function submit() {
  if (!file.value || !title.value || !config.instanceUrl || !config.accessToken) return
  loading.value = true
  error.value = ''
  published.value = undefined
  ipfs.value = undefined
  stage.value = 'ipfs'
  try {
    const ipfsResult = await uploadResourceToIpfs(config, {
      file: file.value,
      title: title.value,
      author: auth.user?.name || '',
      version: '1.0.0',
    })
    ipfs.value = ipfsResult
    stage.value = 'pleroma'
    published.value = await publishResourceToPleroma(config, {
      file: file.value,
      title: title.value,
      description: description.value,
      area: area.value,
      type: type.value,
      license: license.value,
      tags: tags.value.split(',').map(x => x.trim()).filter(Boolean),
      visibility: visibility.value,
      ipfs: ipfsResult,
    })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao preparar ou publicar o recurso.'
  } finally {
    stage.value = 'idle'
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="center">
      <div class="eyebrow">Publicar no Pleroma</div>
      <h1>Novo recurso</h1>
      <p class="lead">O arquivo será registrado no IPFS com evidências criptográficas e também anexado a uma nova postagem no Pleroma.</p>

      <div class="card form" style="margin-top:25px">
        <div class="section-title-row">
          <div>
            <h2>Conectado ao Pleroma</h2>
            <p>
              <strong>{{ auth.user?.name }}</strong> · {{ auth.user?.platform.name }}
            </p>
          </div>
          <span class="evidence-counter">✓ conectado</span>
        </div>
        <div class="status ok">
          <strong>Autorização ativa</strong>
          <p>O REA.fed usará a autorização concedida nesta instância para enviar o arquivo e criar a postagem.</p>
        </div>

        <hr style="border:0;border-top:1px solid #edf0ee;margin:25px 0" />

        <label class="dropzone">
          <input type="file" @change="pick">
          <Upload :size="30" />
          <strong>{{ file?.name || 'Selecione ou arraste seu arquivo' }}</strong>
          <small>{{ file ? `${(file.size / 1000000).toFixed(1)} MB · será enviado ao Pleroma` : 'PDF, documento, imagem, ZIP ou outro arquivo aceito pela instância e pelo serviço IPFS' }}</small>
        </label>

        <div class="form-grid" style="margin-top:20px">
          <div class="field"><label>Título *</label><input class="input" v-model="title" placeholder="Título do recurso"></div>
          <div class="field"><label>Área</label><input class="input" v-model="area" placeholder="Ex.: Física"></div>
          <div class="field"><label>Tipo</label><select class="input" v-model="type"><option>Apostila</option><option>Livro</option><option>Apresentação</option><option>Atividade</option><option>Outro</option></select></div>
          <div class="field"><label>Licença</label><select class="input" v-model="license"><option>CC BY 4.0</option><option>CC BY-SA 4.0</option><option>CC BY-NC 4.0</option></select></div>
        </div>
        <div class="field"><label>Descrição</label><textarea class="input" v-model="description" rows="4" placeholder="Texto que acompanhará o arquivo na postagem"></textarea></div>
        <div class="field"><label>Tags</label><input class="input" v-model="tags" placeholder="física, ensino médio"></div>
        <div class="field">
          <label>Privacidade da postagem</label>
          <select class="input" v-model="visibility">
            <option value="public">Público</option>
            <option value="unlisted">Não listado</option>
            <option value="private">Somente seguidores</option>
            <option value="direct">Direto</option>
          </select>
        </div>

        <div v-if="loading" class="status">
          <strong>{{ stage === 'ipfs' ? '1/2 Registrando no IPFS…' : '2/2 Publicando no Pleroma…' }}</strong>
          <p>{{ stage === 'ipfs' ? 'Calculando SHA-256, assinando o manifesto e enviando o recurso para o IPFS.' : 'O arquivo continua anexado à publicação para manter a compatibilidade com o catálogo federado.' }}</p>
        </div>

        <div v-if="error" class="status bad"><strong>Não foi possível publicar</strong><p>{{ error }}</p></div>

        <button class="btn primary" style="width:100%;min-height:46px" :disabled="!file || !title || loading" @click="submit">
          <Send :size="17" /> {{ loading ? 'Preparando recurso…' : 'Registrar no IPFS e publicar' }}
        </button>
      </div>

      <div v-if="published" class="card" style="margin-top:18px">
        <div class="status ok">
          <strong><ShieldCheck :size="18" /> Recurso registrado e publicado</strong>
          <p>O arquivo foi armazenado no IPFS, recebeu um manifesto assinado e também foi anexado à postagem do Pleroma.</p>
        </div>
        <div v-if="ipfs" class="card" style="margin:16px 0 0;padding:16px;background:#f8faf8">
          <strong>Identidade do recurso</strong>
          <div class="detail-list" style="margin-top:10px">
            <div class="detail"><b>IPFS</b><a :href="ipfs.resource.url" target="_blank" rel="noopener noreferrer">{{ ipfs.resource.cid }}</a></div>
            <div class="detail"><b>SHA-256</b><span style="word-break:break-all">{{ ipfs.resource.sha256 }}</span></div>
            <div class="detail"><b>Manifesto</b><a :href="ipfs.manifest.url" target="_blank" rel="noopener noreferrer">{{ ipfs.manifest.cid }}</a></div>
            <div class="detail"><b>Assinatura</b><a :href="ipfs.signature.url" target="_blank" rel="noopener noreferrer">{{ ipfs.signature.cid }}</a></div>
            <div class="detail"><b>Timestamp</b><a v-if="ipfs.timestamp" :href="ipfs.timestamp.url" target="_blank" rel="noopener noreferrer">{{ ipfs.timestamp.cid }}</a><span v-else>Pendente</span></div>
          </div>
          <p v-if="ipfs.timestampError" class="form-hint">O recurso foi preservado, mas o timestamp OTS ainda não foi criado: {{ ipfs.timestampError }}</p>
        </div>
        <h3>Publicação</h3>
        <div style="display:flex;align-items:center;gap:10px;padding:13px 0;border-bottom:1px solid #edf0ee">
          <FileCheck :size="18" /> <span>{{ published.fileName }}</span>
          <span style="margin-left:auto;color:#287043">✓ enviado</span>
        </div>
        <div class="actions">
          <a v-if="published.status.url" class="btn primary" :href="published.status.url" target="_blank" rel="noopener noreferrer"><ExternalLink :size="16" /> Ver no Pleroma</a>
          <RouterLink class="btn ghost" to="/resources">Voltar aos recursos</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
