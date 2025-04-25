export class DatabaseError extends Error {
  public readonly details?: string[]

  constructor(message: string, details?: string[]) {
    super(message)
    this.name = 'DatabaseError'
    this.details = details
  }
}
