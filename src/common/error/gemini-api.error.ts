export class GeminiApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GeminiApiError'
  }
}
