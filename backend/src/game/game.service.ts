import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class GameService {
  async issuePoints(data: { userId: string; score: number }) {
    await this.userService.updateUser({
      id: data.userId,
      score: data.score,
    });
  }

  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
  ) {}
}
