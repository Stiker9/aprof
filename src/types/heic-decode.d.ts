/** Типов у пакета нет — описано ровно то, чем пользуется src/admin/uploads.ts. */
declare module 'heic-decode' {
  interface DecodedImage {
    width: number
    height: number
    /** Пиксели RGBA, по четыре байта на точку. */
    data: Uint8ClampedArray
  }

  function decode(input: { buffer: Buffer | ArrayBuffer }): Promise<DecodedImage>

  export default decode
}
