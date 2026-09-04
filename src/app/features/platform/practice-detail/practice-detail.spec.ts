import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { PlatformService } from '../platform.service';
import { PracticeDetail } from './practice-detail';

const detail = {
  id: 1,
  name: 'Northgate Rehabilitation Network',
  type: 'hospital_network',
  address: '1 Northgate Ave',
  createdAt: '',
  updatedAt: '',
  siteCount: 2,
  userCount: 5,
  patientCount: 8,
  sites: [
    {
      id: 2,
      practiceId: 1,
      name: 'Northgate Main Hospital',
      type: 'location',
      address: null,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 3,
      practiceId: 1,
      name: 'Rosebank Gait Lab',
      type: 'department',
      address: '12 Oxford Rd',
      createdAt: '',
      updatedAt: '',
    },
  ],
};

async function setup(overrides: Partial<Record<string, unknown>> = {}) {
  TestBed.resetTestingModule();
  const service = {
    getPractice: vi.fn().mockReturnValue(of(detail)),
    addPracticeAdmin: vi.fn().mockReturnValue(of({ id: 9 })),
    ...overrides,
  };
  await TestBed.configureTestingModule({
    imports: [PracticeDetail],
    providers: [provideRouter([]), { provide: PlatformService, useValue: service }],
  }).compileComponents();
  const fixture = TestBed.createComponent(PracticeDetail);
  fixture.componentRef.setInput('id', '1');
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, service };
}

describe('PracticeDetail', () => {
  it('renders the practice, its counts and its sites', async () => {
    const { fixture } = await setup();
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Northgate Rehabilitation Network');
    expect(text).toContain('Hospital network');
    expect(text).toContain('Northgate Main Hospital');
    expect(text).toContain('Rosebank Gait Lab');
  });

  it('adds a practice administrator and reloads', async () => {
    const { fixture, service } = await setup();
    fixture.componentInstance.adminForm.setValue({
      email: 'recovery@northgate-rehab.co.za',
      password: 'temp12345',
    });
    fixture.componentInstance.addAdmin();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(service.addPracticeAdmin).toHaveBeenCalledWith(1, {
      email: 'recovery@northgate-rehab.co.za',
      password: 'temp12345',
    });
    expect(fixture.componentInstance.adminMessage()).toContain('added');
    expect(service.getPractice).toHaveBeenCalledTimes(2);
  });
});
