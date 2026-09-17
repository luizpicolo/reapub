import type { PleromaConfig } from './pleroma'

export interface IpfsUploadResult {
  success: boolean
  resource: {
    fileName: string
    fileSize: number
    sha256: string
    cid: string
    url: string
  }
  manifest: {
    title: string
    author: string
    cid: string
    url: string
    sha256: string
    version: string
    fileName?: string
    fileSize?: number
    createdAt: string
  }
  signature: {
    cid: string
    url: string
  }
  publicKey: {
    cid: string
    url: string
  }
  timestamp: {
    cid: string
    url: string
  } | null
  timestampStatus: 'created' | 'pending'
  timestampError?: string
  verificationUrl: string
}

export interface IpfsVerificationResult {
  overall: 'verified' | 'altered' | 'invalid' | 'incomplete' | 'pending'
  integrity: boolean
  signature: boolean
  authorship: boolean
  timestamp: boolean
  details: string[]
  signer?: { id: string; username?: string; acct?: string }
  source?: { resource: string; manifest: string; signature: string; timestamp: string; publicKey?: string }
  cids?: { cid: string; manifestCid: string; signatureCid: string; timestampCid: string | null; publicKeyCid?: string }
  publicKeySource?: string
  signatureSource?: string
  signatureError?: string
  manifest?: { title?: string; author?: string; signer?: { id: string; username?: string; acct?: string }; cid?: string; sha256?: string; fileName?: string; fileSize?: number; version?: string; createdAt?: string }
  steps?: Array<{ id: string; label: string; valid: boolean; status: 'valid' | 'invalid' | 'pending'; detail: string }>
}

function getIpfsApiUrl() {
  return String(import.meta.env.VITE_REA_IPFS_API_URL || '/api').replace(/\/+$/, '')
}

async function readError(response: Response) {
  try {
    const data = await response.json() as { error?: string }
    if (data.error) return data.error
  } catch { /* ignore non-JSON errors */ }
  return `API REA/IPFS respondeu HTTP ${response.status}.`
}


export async function provisionUserKeys(config: PleromaConfig): Promise<string> {
  if (!config.accessToken) throw new Error('Sua sessão do Pleroma não possui um token de acesso.')

  const response = await fetch(`${getIpfsApiUrl()}/resources/keys`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${config.accessToken}` },
  })

  if (!response.ok) throw new Error(await readError(response))
  return response.text()
}

export async function uploadResourceToIpfs(
  config: PleromaConfig,
  input: { file: File; title: string; author: string; version?: string },
): Promise<IpfsUploadResult> {
  if (!config.accessToken) throw new Error('Sua sessão do Pleroma não possui um token de acesso.')

  const form = new FormData()
  form.append('file', input.file, input.file.name)
  form.append('title', input.title)
  form.append('author', input.author)
  form.append('version', input.version || '1.0.0')

  const response = await fetch(`${getIpfsApiUrl()}/resources/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.accessToken}` },
    body: form,
  })

  if (!response.ok) throw new Error(await readError(response))
  return await response.json() as IpfsUploadResult
}

export async function verifyResourceWithIpfsApi(
  input: { file: File; manifest: File; signature: File; ots: File },
): Promise<IpfsVerificationResult> {
  const form = new FormData()
  form.append('file', input.file, input.file.name)
  form.append('manifest', input.manifest, input.manifest.name)
  form.append('signature', input.signature, input.signature.name)
  form.append('ots', input.ots, input.ots.name)

  const response = await fetch(`${getIpfsApiUrl()}/resources/verify`, {
    method: 'POST',
    body: form,
  })

  if (!response.ok) throw new Error(await readError(response))
  return await response.json() as IpfsVerificationResult
}


export async function verifyResourceIdentity(input: {
  cid: string
  manifestCid: string
  signatureCid: string
  timestampCid?: string
  expectedSignerId?: string
}): Promise<IpfsVerificationResult> {
  const response = await fetch(`${getIpfsApiUrl()}/resources/verify-remote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) throw new Error(await readError(response))
  return await response.json() as IpfsVerificationResult
}
