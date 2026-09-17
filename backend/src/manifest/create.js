import { writeFile } from 'node:fs/promises'
import { sign } from 'node:crypto'
import { getUserPrivateKey } from '../keys/store.js'

export async function createManifest({
  outputDir,
  title,
  author,
  account,
  cid,
  sha256,
  version = '1.0.0',
  fileName,
  fileSize,
  publicKeyCid,
}) {
  const manifest = {
    title,
    author,
    publicKeyCid: publicKeyCid || '',
    signer: {
      id: String(account.id),
      username: account.username || '',
      acct: account.acct || account.username || '',
    },
    cid,
    sha256,
    version,
    fileName,
    fileSize,
    createdAt: new Date().toISOString(),
  }

  const manifestPath = `${outputDir}/manifest.json`
  const signaturePath = `${outputDir}/assinatura.sig`
  const data = Buffer.from(JSON.stringify(manifest, null, 2), 'utf8')
  await writeFile(manifestPath, data)

  const privateKey = await getUserPrivateKey(account.id)
  const signature = sign(null, data, privateKey)
  await writeFile(signaturePath, signature.toString('base64'), 'utf8')

  return { manifest, manifestPath, signaturePath, manifestBuffer: data }
}
