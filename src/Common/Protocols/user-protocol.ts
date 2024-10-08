import { Prisma } from '@prisma/client';
import { UserEntity } from '../Entities/user-entities';

export interface UserProtocol {
  findUserById(id: string): Promise<UserEntity | null>;
  findUserByEmail(email: string): Promise<UserEntity | null>;
  findUserByUserName(username: string): Promise<UserEntity | null>;
  findUserByPhoneNumber(phoneNumber: string): Promise<UserEntity | null>;
  createUser(data: Prisma.UserCreateInput): Promise<UserEntity>;
  updateUserById(id: string, data: Prisma.UserUpdateInput): Promise<UserEntity>;
  deleteUserById(id: string): Promise<UserEntity>;
}
