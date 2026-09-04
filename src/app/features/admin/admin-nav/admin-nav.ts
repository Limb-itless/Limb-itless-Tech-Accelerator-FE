import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/** Tab strip shared by the practice-administration pages. */
@Component({
  selector: 'app-admin-nav',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="admin-nav" aria-label="Practice administration">
      <a
        routerLink="/users"
        routerLinkActive="admin-nav__link--active"
        [routerLinkActiveOptions]="{ exact: true }"
      >
        Staff
      </a>
      <a routerLink="/users/sites" routerLinkActive="admin-nav__link--active">Sites</a>
    </nav>
  `,
  styleUrl: './admin-nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminNav {}
