import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';

@Component({
  selector: 'app-profile-edit-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './profile-edit-page.html',
})
export class ProfileEditPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly user = this.auth.user();
  protected readonly name = signal(this.user?.name ?? '');
  protected readonly phone = signal(this.user?.phone ?? '');
  protected readonly city = signal(this.user?.city ?? '');
  protected readonly error = signal('');

  protected save(): void {
    if (!this.name().trim()) {
      this.error.set('Informe como você quer ser chamado na guilda.');
      return;
    }
    this.auth.updateProfile({ name: this.name(), phone: this.phone(), city: this.city() });
    void this.router.navigateByUrl('/perfil');
  }
}
