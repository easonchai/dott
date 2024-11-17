import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { Web3Module } from './web3/web3.module';
import { GameModule } from './game/game.module';

@Module({
  imports: [UserModule, PrismaModule, Web3Module, GameModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
