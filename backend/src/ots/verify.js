import OpenTimestamps from 'opentimestamps'

export async function verifyTimestamp(manifestBuffer, otsBuffer) {
  const detached = OpenTimestamps.DetachedTimestampFile.fromBytes(
    new OpenTimestamps.Ops.OpSHA256(),
    manifestBuffer,
  )
  const proof = OpenTimestamps.DetachedTimestampFile.deserialize(otsBuffer)
  const result = await OpenTimestamps.verify(proof, detached, {
    ignoreBitcoinNode: true,
    timeout: 5000,
  })
  return result || null
}
