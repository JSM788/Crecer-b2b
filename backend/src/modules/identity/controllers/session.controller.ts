import { Controller, UseGuards } from '@nestjs/common';
import { Endpoint } from '../../../common/decorators/endpoint.decorator';
import { CurrentPrincipal } from '../../../common/decorators/principal.decorator';
import { SessionGuard } from '../../../common/guards/session.guard';
import { AuthenticatedPrincipal } from '../../../common/types/principal';
import { sessionResponseSchema } from '../dto/login.dto';

@Controller('v1/me')
@UseGuards(SessionGuard)
export class SessionController {
  @Endpoint({ method: 'get', output: sessionResponseSchema })
  current(@CurrentPrincipal() principal: AuthenticatedPrincipal) {
    const { tokenHash: _tokenHash, ...identity } = principal;
    return identity;
  }
}
