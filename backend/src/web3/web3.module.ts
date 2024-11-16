import { Module } from '@nestjs/common';
import { Web3Service } from './web3.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [Web3Service],
})
export class Web3Module {}
