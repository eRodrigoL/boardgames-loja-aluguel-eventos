import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService, type UserRole } from '@core/auth/auth.service';

const roles: readonly { readonly value: UserRole; readonly label: string }[] = [
  { value: 'member', label: 'Comum' },
  { value: 'admin', label: 'Administrativo' },
  { value: 'super_admin', label: 'Acesso total' },
];

@Component({
  selector: 'app-user-access-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './user-access-page.html',
})
export class UserAccessPage {
  protected readonly auth = inject(AuthService);
  protected readonly search = signal('');
  protected readonly roles = roles;
  protected readonly users = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    return this.auth
      .users()
      .filter((user) => !query || `${user.name} ${user.email}`.toLocaleLowerCase().includes(query));
  });

  protected updateRole(email: string, role: UserRole): void {
    this.auth.updateRole(email, role);
  }
}
