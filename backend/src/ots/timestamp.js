import OpenTimestamps from 'opentimestamps'
import { writeFile } from 'node:fs/promises'

export async function timestampHash(hash, outputPath) {
  const digest = Buffer.from(hash, 'hex')
  const detached = OpenTimestamps.DetachedTimestampFile.fromHash(
    new OpenTimestamps.Ops.OpSHA256(),
    digest,
  )
  await OpenTimestamps.stamp(detached)
  const ots = Buffer.from(detached.serializeToBytes())
  await writeFile(outputPath, ots)
  return { path: outputPath, size: ots.length }
}
