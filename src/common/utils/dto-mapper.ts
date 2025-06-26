import { plainToClass } from 'class-transformer'

export class DtoMapper {
  static toDto<T>(dtoClass: new (...args: any[]) => T, entity: any): T {
    return plainToClass(dtoClass, entity, { excludeExtraneousValues: true })
  }

  static toDtoArray<T>(dtoClass: new (...args: any[]) => T, entities: any[]): T[] {
    return entities.map((entity) => this.toDto(dtoClass, entity))
  }
}
