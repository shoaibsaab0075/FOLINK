import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UserService } from './application/user.service'
import { ApiResponseUtil } from 'src/common/utils/api-response.util'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

@ApiTags('사용자 관리ㅇ')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: '회원가입' })
  @Post('/signup')
  async createUser(@Body() dto: CreateUserDto): Promise<ApiResponseUtil> {
    await this.userService.checkUsername(dto.username)
    const user = await this.userService.createUser(dto)

    return ApiResponseUtil.success({ user }, '회원가입 성공')
  }

  @ApiOperation({ summary: '모든 사용자 조회' })
  @Get()
  async findAllUser(): Promise<ApiResponseUtil> {
    const users = await this.userService.findAllUser()

    return ApiResponseUtil.success({ users }, '모든 사용자 조회 성공')
  }

  @ApiOperation({ summary: '사용자 조회' })
  @Get(':id')
  async getOneUser(@Param('id') id: number): Promise<ApiResponseUtil> {
    const user = await this.userService.getOneUser(id)

    return ApiResponseUtil.success({ user }, '사용자 조회 성공')
  }

  @ApiOperation({ summary: '사용자 정보 수정' })
  @Patch(':id/update')
  async updateUserStatus(
    @Param('id') id: number,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<ApiResponseUtil> {
    const userStatus = await this.userService.updateUserStatus(id, updateUserDto)

    return ApiResponseUtil.success({ userStatus }, '사용자 정보 수정 성공')
  }

  @ApiOperation({ summary: '사용자 삭제' })
  @Delete(':id')
  async deleteUser(@Param('id') id: number): Promise<ApiResponseUtil> {
    await this.userService.deleteUser(id)

    return ApiResponseUtil.success({}, '사용자 삭제 성공')
  }
}
