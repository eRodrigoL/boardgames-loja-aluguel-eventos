import type { Routes } from '@angular/router';
import { CatalogPage } from './pages/catalog/catalog-page';
import { ContactPage } from './pages/contact/contact-page';
import { EventsPage } from './pages/events/events-page';
import { LoginPage } from './pages/login/login-page';
import { FavoritesPage } from './pages/favorites/favorites-page';
import { GameDetailsPage } from './pages/game-details/game-details-page';
import { EventDetailsPage } from './pages/event-details/event-details-page';
import { AdminGameForm } from './pages/admin-game-form/admin-game-form';
import { AdminEventForm } from './pages/admin-event-form/admin-event-form';
import { adminGuard, signedInGuard, superAdminGuard } from './core/auth/admin.guard';
import { ProfilePage } from './pages/profile/profile-page';
import { ProfileEditPage } from './pages/profile-edit/profile-edit-page';
import { PasswordChangePage } from './pages/password-change/password-change-page';
import { UserAccessPage } from './pages/user-access/user-access-page';
import { SiteConfigPage } from './pages/site-config/site-config-page';

export const routes: Routes = [
  { path: '', component: CatalogPage, title: 'Acervo | Aluguel de jogos' },
  { path: 'acervo', redirectTo: '', pathMatch: 'full' },
  { path: 'eventos', component: EventsPage, title: 'Eventos | Aluguel de jogos' },
  { path: 'eventos/:slug', component: EventDetailsPage, title: 'Evento | Aluguel de jogos' },
  { path: 'jogos/:slug', component: GameDetailsPage, title: 'Jogo | Aluguel de jogos' },
  { path: 'entrar', component: LoginPage, title: 'Entrar | Aluguel de jogos' },
  { path: 'favoritos', component: FavoritesPage, title: 'Favoritos | Aluguel de jogos' },
  {
    path: 'perfil',
    component: ProfilePage,
    canActivate: [signedInGuard],
    title: 'Meu perfil | Aluguel de jogos',
  },
  {
    path: 'perfil/editar',
    component: ProfileEditPage,
    canActivate: [signedInGuard],
    title: 'Editar perfil | Aluguel de jogos',
  },
  {
    path: 'perfil/senha',
    component: PasswordChangePage,
    canActivate: [signedInGuard],
    title: 'Alterar senha | Aluguel de jogos',
  },
  {
    path: 'admin/usuarios',
    component: UserAccessPage,
    canActivate: [superAdminGuard],
    title: 'Privilégios de usuários | Aluguel de jogos',
  },
  {
    path: 'admin/jogos/:id',
    component: AdminGameForm,
    canActivate: [adminGuard],
    title: 'Gerenciar jogo | Aluguel de jogos',
  },
  {
    path: 'admin/eventos/:id',
    component: AdminEventForm,
    canActivate: [adminGuard],
    title: 'Gerenciar evento | Aluguel de jogos',
  },
  {
    path: 'admin/configuracoes',
    component: SiteConfigPage,
    canActivate: [superAdminGuard],
    title: 'Configurações | Aluguel de jogos',
  },
  { path: 'contato', component: ContactPage, title: 'Contato | Aluguel de jogos' },
  { path: '**', redirectTo: '' },
];
