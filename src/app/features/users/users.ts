import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-users',
  template: `
    <section class="page">
      <h1>Users</h1>
      <p>Users feature works!</p>
    </section>
  `,
  styleUrl: './users.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Users {}
