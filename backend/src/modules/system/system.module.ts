import { Module } from '@nestjs/common';
import { SystemController } from './controllers/system.controller';
import { ApiDocumentService } from './services/api-document.service';

@Module({
  controllers: [SystemController],
  providers: [ApiDocumentService],
  exports: [ApiDocumentService],
})
export class SystemModule {}
