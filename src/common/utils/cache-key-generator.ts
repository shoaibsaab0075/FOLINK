import { createHash } from 'crypto'

export class CacheKeyGenerator {
  static generateKey(prefix: string, ...args: string[]): string {
    const combined = args.join(':')
    const hash = createHash('md5').update(combined).digest('hex')
    return `${prefix}:${hash}`
  }
}
