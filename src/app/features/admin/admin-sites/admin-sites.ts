import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { humanise } from '../../patients/patient.model';
import { SITE_TYPES, SiteType } from '../admin.model';
import { AdminSitesService } from '../admin-sites.service';
import { AdminNav } from '../admin-nav/admin-nav';

@Component({
  selector: 'app-admin-sites',
  imports: [RouterLink, AdminNav],
  templateUrl: './admin-sites.html',
  styleUrl: './admin-sites.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSites {
  private readonly service = inject(AdminSitesService);

  readonly humanise = humanise;
  readonly types = SITE_TYPES;

  readonly typeFilter = signal<SiteType | ''>('');

  readonly sites = rxResource({
    params: () => ({ type: this.typeFilter() || undefined }),
    stream: ({ params }) => this.service.list(params.type),
  });

  onType(value: string): void {
    this.typeFilter.set((value as SiteType) || '');
  }
}
