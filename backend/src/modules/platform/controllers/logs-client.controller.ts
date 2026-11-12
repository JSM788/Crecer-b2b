import { Body, Controller } from '@nestjs/common';
import { Endpoint } from '../../../common/decorators/endpoint.decorator';
import { ZodValidationPipe } from '../../../common/http/zod-validation.pipe';
import {
  ClientLogInput,
  clientLogInputSchema,
  clientLogResponseSchema,
} from '../dto/platform.dto';
import { PlatformLogsService } from '../services/platform-logs.service';

@Controller('v1/logs')
export class LogsClientController {
  constructor(private readonly logs: PlatformLogsService) {}

  @Endpoint({
    method: 'post',
    path: 'client',
    input: clientLogInputSchema,
    output: clientLogResponseSchema,
  })
  ingestClientLog(
    @Body(new ZodValidationPipe(clientLogInputSchema)) input: ClientLogInput,
  ) {
    return this.logs.ingestClientLog(input);
  }
}

