import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
} from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  @Get('me/:id')
  async getMe(@Param('id') id: string) {
    const user = await this.userService.getUser({
      id,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body()
    data: {
      name?: string;
      username?: string;
      score?: number;
      walletAddress?: string;
    },
  ) {
    await this.userService.updateUser({
      id,
      name: data.name,
      username: data.username,
      score: data.score,
      walletAddress: data.walletAddress,
    });
  }

  constructor(private readonly userService: UserService) {}
}
