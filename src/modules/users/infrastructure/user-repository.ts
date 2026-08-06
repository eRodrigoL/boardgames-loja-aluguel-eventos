import { AppError, notFound } from '../../../shared/errors/app-error';
import type { AccessIdentity } from '../../../shared/security/access';
import type { UserProfileInput, UserRole } from '../domain/user';

export interface UserRecord {
  readonly id: string;
  readonly identitySubject: string;
  readonly email: string;
  readonly displayName: string;
  readonly phone: string | null;
  readonly city: string | null;
  readonly authProvider: 'cloudflare_access';
  readonly role: UserRole;
  readonly active: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

const columns = `id, identity_subject as identitySubject, email, display_name as displayName, phone, city, auth_provider as authProvider, role, active, created_at as createdAt, updated_at as updatedAt`;

export class UserRepository {
  constructor(private readonly db: D1Database) {}

  async ensureAccessUser(
    identity: AccessIdentity,
    bootstrapSuperAdminEmail?: string,
  ): Promise<UserRecord> {
    const existing = await this.byIdentitySubject(identity.subject);
    if (existing) return existing;

    const timestamp = new Date().toISOString();
    const role: UserRole =
      bootstrapSuperAdminEmail?.toLocaleLowerCase() === identity.email.toLocaleLowerCase()
        ? 'super_admin'
        : 'member';
    await this.db
      .prepare(
        'INSERT INTO users (id, identity_subject, email, display_name, auth_provider, role, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)',
      )
      .bind(
        crypto.randomUUID(),
        identity.subject,
        identity.email,
        identity.email.split('@')[0] || 'Usuário',
        'cloudflare_access',
        role,
        timestamp,
        timestamp,
      )
      .run();
    const created = await this.byIdentitySubject(identity.subject);
    if (!created) throw new AppError('USER_CREATION_FAILED', 500, 'Could not create the user.');
    return created;
  }

  async byIdentitySubject(identitySubject: string): Promise<UserRecord | null> {
    return this.db
      .prepare(`SELECT ${columns} FROM users WHERE identity_subject = ?`)
      .bind(identitySubject)
      .first<UserRecord>();
  }

  async updateProfile(id: string, input: UserProfileInput): Promise<UserRecord> {
    await this.db
      .prepare(
        'UPDATE users SET display_name = ?, phone = ?, city = ?, updated_at = ? WHERE id = ?',
      )
      .bind(
        input.displayName,
        input.phone ?? null,
        input.city ?? null,
        new Date().toISOString(),
        id,
      )
      .run();
    return this.requireById(id);
  }

  async search(query: string): Promise<readonly UserRecord[]> {
    const normalized = query.toLocaleLowerCase();
    return (
      await this.db
        .prepare(
          `SELECT ${columns} FROM users WHERE lower(email) LIKE ? OR lower(display_name) LIKE ? ORDER BY display_name ASC LIMIT 30`,
        )
        .bind(`%${normalized}%`, `%${normalized}%`)
        .all<UserRecord>()
    ).results;
  }

  async updateRole(actor: UserRecord, targetId: string, role: UserRole): Promise<UserRecord> {
    const target = await this.requireById(targetId);
    if (actor.id === target.id && role !== 'super_admin') {
      throw new AppError(
        'CANNOT_REMOVE_OWN_SUPER_ADMIN_ROLE',
        400,
        'A super administrator cannot remove their own final access.',
      );
    }
    if (target.role === 'super_admin' && role !== 'super_admin') {
      const result = await this.db
        .prepare("SELECT COUNT(*) as count FROM users WHERE role = 'super_admin' AND active = 1")
        .first<{ count: number }>();
      if ((result?.count ?? 0) <= 1) {
        throw new AppError(
          'LAST_SUPER_ADMIN',
          400,
          'At least one active super administrator is required.',
        );
      }
    }
    await this.db
      .prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?')
      .bind(role, new Date().toISOString(), targetId)
      .run();
    return this.requireById(targetId);
  }

  private async requireById(id: string): Promise<UserRecord> {
    const user = await this.db
      .prepare(`SELECT ${columns} FROM users WHERE id = ?`)
      .bind(id)
      .first<UserRecord>();
    if (!user) throw notFound('User');
    return user;
  }
}
