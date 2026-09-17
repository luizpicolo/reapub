<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { listMyPleromaResources } from '../api/resources'
import { loadPleromaConfig, normalizeInstanceUrl } from '../api/pleroma'
import type { Resource } from '../types'

const route = useRoute()
const router = useRouter()
const form = reactive({ title: '', description: '', area: '', type: '', license: '', tags: '' })
const loading = ref(true)
const saving = ref(false)
const error = ref('')

function statusId() {
  const id = String(route.params.id)
  return id.startsWith('pleroma-') ? id.slice(8) : id
}

async function save() {
  saving.value = true
  error.value = ''
  try {
    const config = loadPleromaConfig()
    const response = await fetch(`${normalizeInstanceUrl(config.instanceUrl)}/api/v1/statuses/${encodeURIComponent(statusId())}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${config.accessToken}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ status: `${form.title}\n\n${form.description}\n\nÁrea: ${form.area}\nTipo: ${form.type}\nLicença: ${form.license}\nTags: ${form.tags}` }),
    })
    if (!response.ok) throw new Error(`Não foi possível salvar as alterações (${response.status}).`)
    await router.push(`/resources/${route.params.id}`)
  } catch (e) { error.value = e instanceof Error ? e.message : 'Não foi possível salvar.' }
  finally { saving.value = false }
}

onMounted(async () => {
  try {
    const resource = (await listMyPleromaResources()).find((item: Resource) => item.id === String(route.params.id))
    if (!resource) throw new Error('Recurso não encontrado.')
    Object.assign(form, { title: resource.title, description: resource.description, area: resource.area, type: resource.type, license: resource.license, tags: resource.tags.join(', ') })
  } catch (e) { error.value = e instanceof Error ? e.message : 'Não foi possível carregar o recurso.' }
  finally { loading.value = false }
})
</script>
<template>
  <div class="page"><div class="center" style="max-width:760px">
    <div class="eyebrow">Editar recurso</div><h1>Alterar informações</h1>
    <p v-if="loading">Carregando...</p><div v-else class="card">
      <form @submit.prevent="save" style="display:grid;gap:14px">
        <label>Título<input v-model="form.title" required maxlength="500" /></label>
        <label>Descrição<textarea v-model="form.description" rows="5" required /></label>
        <label>Área/categoria<input v-model="form.area" /></label>
        <label>Tipo<input v-model="form.type" /></label>
        <label>Licença<input v-model="form.license" /></label>
        <label>Tags (separadas por vírgula)<input v-model="form.tags" /></label>
        <div v-if="error" class="status bad">{{ error }}</div>
        <div style="display:flex;gap:10px"><button class="btn primary" :disabled="saving">{{ saving ? 'Salvando...' : 'Salvar alterações' }}</button><button class="btn ghost" type="button" @click="router.back()">Cancelar</button></div>
      </form>
    </div>
  </div></div>
</template>
