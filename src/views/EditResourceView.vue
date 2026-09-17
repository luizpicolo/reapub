<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Swal from 'sweetalert2'
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
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        status: `${form.title}\n\n${form.description}\n\nÁrea: ${form.area}\nTipo: ${form.type}\nLicença: ${form.license}\nTags: ${form.tags}`,
      }),
    })
    if (!response.ok) throw new Error(`Não foi possível salvar as alterações (${response.status}).`)

    await Swal.fire({
      icon: 'success',
      title: 'Salvo',
      text: 'As alterações foram salvas.',
      confirmButtonText: 'OK',
    })
    await router.push(`/resources/${route.params.id}`)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Não foi possível salvar.'
    await Swal.fire({ icon: 'error', title: 'Erro', text: error.value, confirmButtonText: 'OK' })
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const resource = (await listMyPleromaResources()).find((item: Resource) => item.id === String(route.params.id))
    if (!resource) throw new Error('Recurso não encontrado.')
    Object.assign(form, {
      title: resource.title,
      description: resource.description,
      area: resource.area,
      type: resource.type,
      license: resource.license,
      tags: resource.tags.join(', '),
    })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Não foi possível carregar o recurso.'
    await Swal.fire({ icon: 'error', title: 'Erro', text: error.value, confirmButtonText: 'OK' })
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="page edit-page">
    <div class="center edit-container">
      <div class="eyebrow">Editar recurso</div>
      <h1>Alterar informações</h1>
      <p class="edit-intro">Atualize os dados básicos do recurso publicado.</p>

      <div v-if="loading" class="card edit-card loading-state">Carregando...</div>
      <section v-else class="card edit-card">
        <form class="edit-form" @submit.prevent="save">
          <div class="field-group">
            <label for="title">Título</label>
            <input id="title" v-model="form.title" required maxlength="500" />
          </div>
          <div class="field-group">
            <label for="description">Descrição</label>
            <textarea id="description" v-model="form.description" rows="5" required />
          </div>
          <div class="form-grid">
            <div class="field-group">
              <label for="area">Área/categoria</label>
              <input id="area" v-model="form.area" />
            </div>
            <div class="field-group">
              <label for="type">Tipo</label>
              <input id="type" v-model="form.type" />
            </div>
            <div class="field-group">
              <label for="license">Licença</label>
              <input id="license" v-model="form.license" />
            </div>
            <div class="field-group">
              <label for="tags">Tags</label>
              <input id="tags" v-model="form.tags" placeholder="Separadas por vírgula" />
            </div>
          </div>

          <div v-if="error" class="status bad">{{ error }}</div>
          <div class="form-actions">
            <button class="btn primary" :disabled="saving" type="submit">{{ saving ? 'Salvando...' : 'Salvar alterações' }}</button>
            <button class="btn ghost" type="button" @click="router.back()">Cancelar</button>
          </div>
        </form>
      </section>
    </div>
  </main>
</template>

<style scoped>
.edit-page { padding: 36px 20px 56px; }
.edit-container { max-width: 820px; margin: 0 auto; }
.edit-intro { margin: 8px 0 24px; color: var(--muted, #667085); }
.edit-card { padding: 28px; border-radius: 16px; }
.edit-form { display: grid; gap: 20px; }
.field-group { display: grid; gap: 8px; }
.field-group label { font-weight: 600; font-size: 0.95rem; }
.field-group input, .field-group textarea { width: 100%; box-sizing: border-box; border: 1px solid var(--border, #d0d5dd); border-radius: 10px; padding: 12px 14px; font: inherit; background: var(--surface, #fff); color: inherit; transition: border-color .2s, box-shadow .2s; }
.field-group input:focus, .field-group textarea:focus { outline: none; border-color: var(--primary, #6366f1); box-shadow: 0 0 0 3px rgba(99, 102, 241, .14); }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
.form-actions { display: flex; gap: 12px; flex-wrap: wrap; padding-top: 4px; }
.loading-state { text-align: center; }
@media (max-width: 640px) { .edit-card { padding: 20px; } .form-grid { grid-template-columns: 1fr; } }
</style>
