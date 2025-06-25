import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { UpdateUserDto } from '../dto/update-user.dto'
import * as bcrypt from 'bcryptjs'

@Entity({ name: 'users', comment: '사용자 테이블' })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn({
    type: 'integer',
    name: 'id',
    comment: 'User ID'
  })
  public id!: number

  @Column({
    type: 'varchar',
    length: 50,
    name: 'username',
    comment: '사용자 이름',
    unique: true
  })
  public username!: string

  @Column({
    type: 'varchar',
    length: 255,
    name: 'password',
    comment: '사용자 비밀번호'
  })
  public password!: string

  @Column({
    type: 'timestamp',
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
    comment: '사용자 생성 시간'
  })
  public createdAt!: Date

  @Column({
    type: 'timestamp',
    name: 'updated_at',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
    comment: '사용자 정보 수정 시간'
  })
  public updatedAt!: Date

  @Column({
    type: 'boolean',
    name: 'is_deleted',
    default: false,
    comment: '사용자 삭제 여부'
  })
  public isDeleted!: boolean

  @Column({
    type: 'timestamp',
    name: 'deleted_at',
    nullable: true,
    comment: '사용자 삭제 시간'
  })
  public deletedAt?: Date | null

  public async updateUser(dto: UpdateUserDto): Promise<void> {
    if (dto.username) {
      this.username = dto.username
    }
    if (dto.password) {
      this.password = await bcrypt.hash(dto.password, await bcrypt.genSalt())
    }
  }

  public async deleteUser(): Promise<void> {
    this.isDeleted = true
    this.deletedAt = new Date()
  }
}
