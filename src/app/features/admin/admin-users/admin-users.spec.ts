import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AdminUsersService } from '../admin-users.service';
import { AdminUsers } from './admin-users';

const page = {
  items: [
    {
      id: 1,
      email: 'clinician@northgate-rehab.co.za',
      role: 'clinician',
      isActive: true,
      practiceId: 1,
      siteId: 2,
      practiceName: 'Northgate',
      siteName: 'Northgate Main Hospital',
    },
    {
      id: 2,
      email: 'former@northgate-rehab.co.za',
      role: 'prosthetist',
      isActive: false,
      practiceId: 1,
      siteId: null,
      practiceName: 'Northgate',
      siteName: null,
    },
  ],
  total: 2,
  limit: 20,
  offset: 0,
};

async function setup(list = vi.fn().mockReturnValue(of(page))) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [AdminUsers],
    providers: [provideRouter([]), { provide: AdminUsersService, useValue: { list } }],
  }).compileComponents();
  const fixture = TestBed.createComponent(AdminUsers);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, list };
}

describe('AdminUsers', () => {
  it('renders a row per user with role, site and status', async () => {
    const { fixture } = await setup();
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('clinician@northgate-rehab.co.za');
    expect(text).toContain('Prosthetist');
    expect(text).toContain('Inactive');
  });

  it('passes role and status filters to the service', async () => {
    const { fixture, list } = await setup();
    list.mockClear();
    fixture.componentInstance.onRole('prosthetist');
    fixture.componentInstance.onStatus('inactive');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'prosthetist', active: false, offset: 0 }),
    );
  });

  it('pages forward', async () => {
    const many = { ...page, total: 40 };
    const { fixture } = await setup(vi.fn().mockReturnValue(of(many)));
    (fixture as ComponentFixture<AdminUsers>).componentInstance.next();
    expect(fixture.componentInstance.offset()).toBe(20);
  });
});
