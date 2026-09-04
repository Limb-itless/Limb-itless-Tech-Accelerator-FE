import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { InvolvementsService } from '../../involvements/involvements.service';
import { NotesService } from '../notes.service';
import { NoteForm } from './note-form';

interface ServiceStub {
  get: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
}

function stub(): ServiceStub {
  return {
    get: vi.fn(),
    create: vi.fn().mockReturnValue(of({ id: 2 })),
    update: vi.fn().mockReturnValue(of({ id: 2 })),
  };
}

async function build(service: ServiceStub) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [NoteForm],
    providers: [
      provideRouter([]),
      { provide: NotesService, useValue: service },
      { provide: InvolvementsService, useValue: { list: vi.fn().mockReturnValue(of([])) } },
    ],
  }).compileComponents();
  return vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
}

describe('NoteForm', () => {
  it('does not submit an empty note', async () => {
    const service = stub();
    await build(service);
    const fixture = TestBed.createComponent(NoteForm);
    fixture.componentRef.setInput('id', '4');
    fixture.detectChanges();
    fixture.componentInstance.submit();
    expect(service.create).not.toHaveBeenCalled();
  });

  it('creates a note and returns to the timeline', async () => {
    const service = stub();
    const navigate = await build(service);
    const fixture = TestBed.createComponent(NoteForm);
    fixture.componentRef.setInput('id', '4');
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({ body: '  Reviewed today  ' });
    fixture.componentInstance.submit();

    expect(service.create).toHaveBeenCalledWith(4, { body: 'Reviewed today', involvementId: null });
    expect(navigate).toHaveBeenCalledWith(['/patients', 4, 'timeline']);
  });

  it('prefills and updates in edit mode, keeping the involvement link', async () => {
    const service = stub();
    service.get.mockReturnValue(
      of({
        id: 7,
        patientId: 4,
        involvementId: 5,
        authorId: 1,
        body: 'Old body',
        createdAt: '',
        updatedAt: '',
      }),
    );
    const navigate = await build(service);
    const fixture = TestBed.createComponent(NoteForm);
    fixture.componentRef.setInput('id', '4');
    fixture.componentRef.setInput('noteId', '7');
    fixture.componentRef.setInput('mode', 'edit');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.body.value).toBe('Old body');
    expect(fixture.componentInstance.form.controls.involvementId.value).toBe('5');

    fixture.componentInstance.form.patchValue({ body: 'New body' });
    fixture.componentInstance.submit();
    expect(service.update).toHaveBeenCalledWith(4, 7, { body: 'New body', involvementId: 5 });
    expect(navigate).toHaveBeenCalledWith(['/patients', 4, 'timeline']);
  });
});
