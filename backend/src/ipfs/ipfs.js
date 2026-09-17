import { create } from 'kubo-rpc-client'
import { createReadStream } from 'node:fs'

let client

function getClient() {
  if (!client) {
    const url = process.env.IPFS_API_URL || 'http://127.0.0.1:5001'
    client = create({ url })
  }
  return client
}

export async function uploadToIPFS(filePath) {
  const file = createReadStream(filePath)
  const { cid, size } = await getClient().add(file)
  await getClient().pin.add(cid)
  return { cid: cid.toString(), size: Number(size || 0) }
}

export async function uploadBufferToIPFS(buffer, fileName = 'arquivo') {
  const { cid, size } = await getClient().add({ path: fileName, content: buffer })
  await getClient().pin.add(cid)
  return { cid: cid.toString(), size: Number(size || buffer.length) }
}
