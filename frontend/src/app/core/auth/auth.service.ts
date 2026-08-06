import { Injectable, computed, signal } from '@angular/core';

export type UserRole = 'member' | 'admin' | 'super_admin';
export type AuthProvider = 'email' | 'google' | 'apple';

export interface SignedInUser {
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly city: string | null;
  readonly role: UserRole;
  readonly provider: AuthProvider;
}

export interface UserProfileInput {
  readonly name: string;
  readonly phone: string | null;
  readonly city: string | null;
}

const sessionStorageKey = 'dragao-imaginario:session';
const directoryStorageKey = 'dragao-imaginario:development-users';

const developmentProfiles: Record<UserRole, SignedInUser> = {
  member: {
    name: 'Comum',
    email: 'comum@dragaoimaginario.local',
    phone: null,
    city: 'Vila dos Dados',
    role: 'member',
    provider: 'email',
  },
  admin: {
    name: 'Privilegiado',
    email: 'admin@dragaoimaginario.local',
    phone: null,
    city: 'Vila dos Dados',
    role: 'admin',
    provider: 'email',
  },
  super_admin: {
    name: 'Total',
    email: 'super-admin@dragaoimaginario.local',
    phone: null,
    city: 'Vila dos Dados',
    role: 'super_admin',
    provider: 'email',
  },
};

/**
 * Development-only session and user directory. Production identities and roles
 * must come from Cloudflare Access and be enforced by the Worker.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly directory = signal<Record<string, SignedInUser>>(this.restoreDirectory());
  private readonly currentUser = signal<SignedInUser | null>(this.restoreSession());
  readonly user = this.currentUser.asReadonly();
  readonly users = computed(() =>
    Object.values(this.directory()).sort((left, right) =>
      left.name.localeCompare(right.name, 'pt-BR'),
    ),
  );
  readonly isSignedIn = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'admin' || role === 'super_admin';
  });
  readonly isSuperAdmin = computed(() => this.currentUser()?.role === 'super_admin');

  signIn(email: string, provider: AuthProvider): void {
    const normalizedEmail = email.trim().toLocaleLowerCase();
    const existing = this.directory()[normalizedEmail];
    const user =
      existing ??
      ({
        name: normalizedEmail.split('@')[0] || 'Aventureiro',
        email: normalizedEmail,
        phone: null,
        city: null,
        role: 'member',
        provider,
      } satisfies SignedInUser);
    this.saveUser({ ...user, provider });
    this.setSession({ ...user, provider });
  }

  signInAs(role: UserRole): void {
    const user = developmentProfiles[role];
    this.saveUser(user);
    this.setSession(user);
  }

  updateProfile(input: UserProfileInput): void {
    const current = this.currentUser();
    if (!current) return;
    const user: SignedInUser = {
      ...current,
      name: input.name.trim() || current.name,
      phone: input.phone?.trim() || null,
      city: input.city?.trim() || null,
    };
    this.saveUser(user);
    this.setSession(user);
  }

  updateRole(email: string, role: UserRole): void {
    const user = this.directory()[email];
    if (!user) return;
    const updated = { ...user, role } satisfies SignedInUser;
    this.saveUser(updated);
    if (this.currentUser()?.email === email) this.setSession(updated);
  }

  signOut(): void {
    this.currentUser.set(null);
    localStorage.removeItem(sessionStorageKey);
  }

  private saveUser(user: SignedInUser): void {
    const next = { ...this.directory(), [user.email]: user };
    this.directory.set(next);
    localStorage.setItem(directoryStorageKey, JSON.stringify(next));
  }

  private setSession(user: SignedInUser): void {
    this.currentUser.set(user);
    localStorage.setItem(sessionStorageKey, JSON.stringify(user));
  }

  private restoreSession(): SignedInUser | null {
    return this.parseUser(localStorage.getItem(sessionStorageKey));
  }

  private restoreDirectory(): Record<string, SignedInUser> {
    try {
      const stored = JSON.parse(localStorage.getItem(directoryStorageKey) ?? '{}') as Record<
        string,
        unknown
      >;
      const restored = Object.values(stored).flatMap((value) => {
        const user = this.parseUser(JSON.stringify(value));
        return user ? [[user.email, user] as const] : [];
      });
      return { ...developmentProfiles, ...Object.fromEntries(restored) };
    } catch {
      return { ...developmentProfiles };
    }
  }

  private parseUser(value: string | null): SignedInUser | null {
    try {
      const user = JSON.parse(value ?? 'null') as Partial<SignedInUser>;
      if (
        typeof user?.name !== 'string' ||
        typeof user.email !== 'string' ||
        (user.role !== 'member' && user.role !== 'admin' && user.role !== 'super_admin') ||
        (user.provider !== 'email' && user.provider !== 'google' && user.provider !== 'apple')
      ) {
        return null;
      }
      return {
        name: user.name,
        email: user.email,
        phone: typeof user.phone === 'string' ? user.phone : null,
        city: typeof user.city === 'string' ? user.city : null,
        role: user.role,
        provider: user.provider,
      };
    } catch {
      return null;
    }
  }
}
