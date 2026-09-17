import { loadPleromaConfig, normalizeInstanceUrl } from './pleroma'

export interface ResourceDeletionReport {
  statusId: string
  localDeletion: { attempted: boolean; completed: boolean; details: string }
  federation: { requested: boolean; completed: boolean; details: string }
  ipfs: { attempted: boolean; completed: boolean; details: string }
  warnings: string[]
}

/**
 * Excludes an author's Pleroma status.
 * Federation is asynchronous; IPFS copies held by other nodes remain.
 */
export async function deletePleromaResource(statusId: string): Promise<ResourceDeletionReport> {
  const config = loadPleromaConfig()
  const instanceUrl = normalizeInstanceUrl(config.instanceUrl)

  if (!instanceUrl || !config.accessToken.trim()) {
    throw new Error('Nenhuma sessão Pleroma autenticada está disponível.')
  }
  if (!statusId.trim()) throw new Error('O ID da publicação é obrigatório.')

  const report: ResourceDeletionReport = {
    statusId,
    localDeletion: { attempted: true, completed: false, details: '' },
    federation: { requested: true, completed: false, details: '' },
    ipfs: {
      attempted: false,
      completed: false,
      details: 'A remoção de pins IPFS precisa ser executada pelo backend com acesso ao nó IPFS.',
    },
    warnings: [
      'A propagação federada é assíncrona e depende dos servidores remotos.',
      'A exclusão do status não remove cópias ou pins IPFS mantidos por outros nós.',
    ],
  }

  let response: Response
  try {
    response = await fetch(
      `${instanceUrl}/api/v1/statuses/${encodeURIComponent(statusId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${config.accessToken.trim()}`,
          Accept: 'application/json',
        },
      },
    )
  } catch {
    report.localDeletion.details = 'Falha de conexão com a instância Pleroma.'
    report.federation.details = 'A solicitação não foi enviada.'
    throw new Error(report.localDeletion.details)
  }

  if (!response.ok) {
    const body = await response.text()
    const details = `${response.status} ${response.statusText}${
      body ? ` — ${body.slice(0, 500)}` : ''
    }`
    report.localDeletion.details = details
    report.federation.details = 'A exclusão não foi confirmada pela instância.'
    throw new Error(`Não foi possível excluir a publicação: ${details}`)
  }

  report.localDeletion.completed = true
  report.localDeletion.details = 'Publicação excluída pela API Pleroma.'
  report.federation.completed = true
  report.federation.details =
    'A instância aceitou a exclusão; a propagação ActivityPub será assíncrona.'

  return report
}
