import type { Login } from '../application/login';
import type { Authenticate } from '../application/authenticate';
import type { Logout } from '../application/logout';
import type { Provision } from '../application/provision';
import type { Principal } from '../domain/principal';
import { companyNameSchema, loginSchema } from './identity.schemas';

export class IdentityFacade {
  constructor(private readonly loginUseCase: Login, private readonly authenticateUseCase: Authenticate,
    private readonly logoutUseCase: Logout, private readonly provisionUseCase: Provision) {}

  async login(input: unknown) { return this.loginUseCase.execute(loginSchema.parse(input)); }
  authenticate(token: string, company?: string) { return this.authenticateUseCase.execute(token, company); }
  logout(principal: Principal) { return this.logoutUseCase.execute(principal); }

  async provision(slug: string, name: string, email: string, password: string, timeZone = 'UTC') {
    const input = loginSchema.parse({ company: slug, email, password });
    return this.provisionUseCase.execute({ slug: input.company, name: companyNameSchema.parse(name),
      email: input.email, password: input.password, timeZone });
  }
}
