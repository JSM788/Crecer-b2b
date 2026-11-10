import { DynamicModule, Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({})
export class PrismaModule {
  static register(prisma: PrismaService): DynamicModule {
    return {
      module: PrismaModule,
      providers: [{ provide: PrismaService, useValue: prisma }],
      exports: [PrismaService],
    };
  }
}
