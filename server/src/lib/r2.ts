export interface R2Uploader {
  upload(key: string, data: ArrayBuffer, contentType: string): Promise<string>
}

export function createR2Uploader(bucket: R2Bucket, publicUrl: string): R2Uploader {
  return {
    async upload(key, data, contentType) {
      await bucket.put(key, data, { httpMetadata: { contentType } })
      return `${publicUrl}/${key}`
    },
  }
}
