import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Auth } from '../../../core/auth/auth';
import { humanise } from '../patient.model';
import { PatientsService } from '../patients.service';
import { DeviceList } from '../devices/device-list/device-list';

@Component({
  selector: 'app-patient-detail',
  imports: [RouterLink, DeviceList],
  templateUrl: './patient-detail.html',
  styleUrl: './patient-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientDetail {
  private readonly service = inject(PatientsService);
  private readonly auth = inject(Auth);

  readonly humanise = humanise;

  /** `:id` route parameter (component input binding). */
  readonly id = input.required<string>();

  readonly busy = signal(false);

  readonly patient = rxResource({
    params: () => ({ id: Number(this.id()) }),
    stream: ({ params }) => this.service.get(params.id),
  });

  readonly canEdit = computed(() => {
    const role = this.auth.currentUser()?.role;
    return role === 'clinician' || role === 'prosthetist';
  });

  readonly age = computed(() => {
    const dob = this.patient.value()?.dateOfBirth;
    if (!dob) {
      return null;
    }
    const birth = new Date(dob);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    const beforeBirthday =
      now.getMonth() < birth.getMonth() ||
      (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
    if (beforeBirthday) {
      years -= 1;
    }
    return years;
  });

  setActive(active: boolean): void {
    const current = this.patient.value();
    if (!current || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.service.setActive(current.id, active).subscribe({
      next: () => {
        this.busy.set(false);
        this.patient.reload();
      },
      error: () => this.busy.set(false),
    });
  }
}
