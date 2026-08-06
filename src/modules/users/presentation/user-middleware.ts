import type { MiddlewareHandler } from 'hono';
import type { Env } from '../../../env';
import { AppError } from '../../../shared/errors/app-error';
import type { AccessIdentity } from '../../../shared/security/access';
import type { UserRole } from '../domain/user';
import { UserRepository, type UserRecord } from '../infrastructure/user-repository';

export type UserAccessEnvironment = {
  Bindings: Env;
  Variables: { accessIdentity: AccessIdentity; currentUser: UserRecord };
};

const roleWeight: Record<UserRole, number> = {
  member: 0,
  admin: 1,
  super_admin: 2,
};

export const loadCurrentUser: MiddlewareHandler<UserAccessEnvironment> = async (c, next) => {
  const user = await new UserRepository(c.env.DB).ensureAccessUser(
    c.get('accessIdentity'),
    c.env.BOOTSTRAP_SUPER_ADMIN_EMAIL,
  );
  if (!user.active) throw new AppError('USER_ACCOUNT_INACTIVE', 403, 'This account is inactive.');
  c.set('currentUser', user);
  await next();
};

export function requireRole(minimumRole: UserRole): MiddlewareHandler<UserAccessEnvironment> {
  return async (c, next) => {
    if (roleWeight[c.get('currentUser').role] < roleWeight[minimumRole]) {
      throw new AppError('INSUFFICIENT_ACCESS', 403, 'This action requires additional access.');
    }
    await next();
  };
}
