import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  imports: [RouterLink],
  template: `
    <section class="page">
      <h1>Access denied</h1>
      <p>Your role does not have access to this page.</p>
      <a routerLink="/dashboard">Back to dashboard</a>
    </section>
  `,
  styleUrl: './forbidden.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Forbidden {}
