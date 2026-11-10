import { Controller, Get } from '@nestjs/common';
import { z } from 'zod';
import { Endpoint } from '../../../common/decorators/endpoint.decorator';
import { ApiDocumentService } from '../services/api-document.service';

@Controller('v1')
export class SystemController {
  constructor(private readonly documents: ApiDocumentService) {}
  @Endpoint({
    method: 'get',
    path: 'health',
    output: z.object({ status: z.literal('ok') }),
    public: true,
  })
  health() {
    return { status: 'ok' };
  }
  @Get('openapi.json')
  schema() {
    return this.documents.document();
  }
}
