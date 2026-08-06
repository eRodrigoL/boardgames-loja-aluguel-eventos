import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';

@Component({
  selector: 'app-password-change-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './password-change-page.html',
})
export class PasswordChangePage {
  private readonly auth = inject(AuthService);
  protected readonly canChangePassword = computed(() => this.auth.user()?.provider === 'email');
  protected readonly newPassword = signal('');
  protected readonly confirmation = signal('');
  protected readonly error = signal('');
  protected readonly success = signal('');

  protected save(): void {
    if (this.newPassword().length < 8) {
      this.error.set('Use ao menos oito caracteres na nova senha.');
      return;
    }
    if (this.newPassword() !== this.confirmation()) {
      this.error.set('A confirmação não corresponde à nova senha.');
      return;
    }
    this.error.set('');
    this.success.set('Senha atualizada para a demonstração.');
  }
}
