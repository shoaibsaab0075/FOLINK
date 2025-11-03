

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { User } from '../entities/user.entity';
import { UserFactory } from '../factory/user.factory';
import { CreateUserDto } from '../dto/create-user.dto';
import { ResponseUserDto } from '../dto/response-user.dto';

describe('UserService', () => {
  let service: UserService;
  let userRepository: Repository<User>;
  let userFactory: UserFactory;

  const mockUserRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockUserFactory = {
    createUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: UserFactory,
          useValue: mockUserFactory,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    userFactory = module.get<UserFactory>(UserFactory);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a new user and return a ResponseUserDto', async () => {
      const createUserDto: CreateUserDto = {
        username: 'testuser',
        password: 'password',
      };
      const user = new User();
      user.id = 1;
      user.username = 'testuser';

      const expectedResult = ResponseUserDto.fromEntity(user);

      mockUserFactory.createUser.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(user);

      const result = await service.createUser(createUserDto);

      expect(mockUserFactory.createUser).toHaveBeenCalledWith(createUserDto);
      expect(mockUserRepository.save).toHaveBeenCalledWith(user);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getOneUser', () => {
    it('should return a user when a valid id is provided', async () => {
      const userId = 1;
      const user = new User();
      user.id = userId;
      user.username = 'testuser';

      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.getOneUser(userId);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(result).toEqual(user);
    });

    it('should throw a custom error when an invalid id is provided', async () => {
      const userId = 999;
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.getOneUser(userId)).rejects.toMatchObject({
        statusCode: 404,
        message: `사용자를 찾을 수 없습니다. ID: ${userId}`,
        error: {
          code: 'USER_NOT_FOUND',
        },
      });
    });
  });

  describe('findAllUser', () => {
    it('should return an array of users', async () => {
      const users = [new User(), new User()];
      mockUserRepository.find.mockResolvedValue(users);

      const expectedResult = users.map(user => ResponseUserDto.fromEntity(user));

      const result = await service.findAllUser();

      expect(mockUserRepository.find).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should return an empty array when no users are found', async () => {
      mockUserRepository.find.mockResolvedValue([]);

      const result = await service.findAllUser();

      expect(mockUserRepository.find).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
