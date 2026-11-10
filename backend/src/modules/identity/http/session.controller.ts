import { Controller, Get, UseGuards } from '@nestjs/common';
import { Principal } from '../domain/principal';
import { CurrentPrincipal } from './principal.decorator';
import { SessionGuard } from './session.guard';

@Controller('v1/me')
@UseGuards(SessionGuard)
export class SessionController {
  @Get()
  current(@CurrentPrincipal() principal: Principal) {
    const { tokenHash: _tokenHash, ...identity } = principal;
    return identity;
  }
}
