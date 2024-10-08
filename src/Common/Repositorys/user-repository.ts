import { Injectable } from '@nestjs/common';
import { PrismaService } from '../Database-Management/Prisma/prisma-service';
import { UserProtocol } from '../Protocols/user-protocol';
import { UserEntity } from '../Entities/user-entities';
import { Prisma } from '@prisma/client';

@Injectable()
export class UserRepository implements UserProtocol {
  constructor(private readonly prisma: PrismaService) {}

  // Find user by ID
  async findUserById(id: string): Promise<UserEntity | null> {
    return await this.prisma.user.findUnique({ where: { id } });
  }

  // Find user by email
  async findUserByEmail(email: string): Promise<UserEntity | null> {
    return await this.prisma.user.findUnique({ where: { email } });
  }

  async findUserByUserName(username: string): Promise<UserEntity | null> {
    return await this.prisma.user.findUnique({ where: { username } });
  }

  // Find user by phone number
  async findUserByPhoneNumber(phoneNumber: string): Promise<UserEntity | null> {
    return await this.prisma.user.findUnique({ where: { phone: phoneNumber } });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<UserEntity> {
    return await this.prisma.user.create({ data });
  }

  // Update user data by ID
  async updateUserById(
    id: string,
    data: Prisma.UserUpdateInput,
  ): Promise<UserEntity> {
    return await this.prisma.user.update({
      where: { id },
      data,
    });
  }

  // Delete user by ID
  async deleteUserById(id: string): Promise<UserEntity> {
    return await this.prisma.user.delete({ where: { id } });
  }
}
