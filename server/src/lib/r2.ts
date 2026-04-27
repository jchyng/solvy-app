export interface R2Uploader {
  upload(key: string, data: ArrayBuffer, contentType: string): Promise<string>
}

export function createR2Uploader(bucket: R2Bucket | undefined, publicUrl: string): R2Uploader {
  if (!bucket) {
    // dev 환경: R2 bucket이 없으면 URL만 반환 (파일은 메모리에 유지 안 됨)
    // 현재 OCR은 imageUrl을 문자열로만 LLM에 전달하므로 동작에 지장 없음
    return {
      async upload(key, _data, _contentType) {
        return `${publicUrl}/dev-uploads/${key}`
      },
    }
  }

  return {
    async upload(key, data, contentType) {
      await bucket.put(key, data, { httpMetadata: { contentType } })
      return `${publicUrl}/${key}`
    },
  }
}
