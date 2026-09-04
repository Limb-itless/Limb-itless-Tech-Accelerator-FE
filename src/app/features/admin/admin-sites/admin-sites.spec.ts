import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AdminSitesService } from '../admin-sites.service';
import { AdminSites } from './admin-sites';

const sites = [
  {
    id: 2,
    practiceId: 1,
    name: 'Northgate Main Hospital',
    type: 'location',
    address: '1 Ave',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 3,
    practiceId: 1,
    name: 'Rosebank Gait Lab',
    type: 'department',
    address: null,
    createdAt: '',
    updatedAt: '',
  },
];

async function setup(list = vi.fn().mockReturnValue(of(sites))) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [AdminSites],
    providers: [provideRouter([]), { provide: AdminSitesService, useValue: { list } }],
  }).compileComponents();
  const fixture = TestBed.createComponent(AdminSites);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, list };
}

describe('AdminSites', () => {
  it('renders a row per site', async () => {
    const { fixture } = await setup();
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(2);
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Rosebank Gait Lab');
    expect(text).toContain('Department');
  });

  it('passes the type filter to the service', async () => {
    const { fixture, list } = await setup();
    list.mockClear();
    fixture.componentInstance.onType('department');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(list).toHaveBeenCalledWith('department');
  });
});
