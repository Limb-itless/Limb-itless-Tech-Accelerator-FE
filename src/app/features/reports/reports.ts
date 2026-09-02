import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-reports',
  template: `
    <section class="page">
      <h1>Reports</h1>
      <p>Reports feature works!</p>
    </section>
  `,
  styleUrl: './reports.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reports {}
