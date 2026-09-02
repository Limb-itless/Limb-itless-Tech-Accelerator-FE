import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';

import { Forbidden } from './forbidden';

describe('Forbidden', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Forbidden],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Forbidden);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
