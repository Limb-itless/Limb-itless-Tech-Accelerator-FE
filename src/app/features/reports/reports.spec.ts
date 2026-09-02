import { TestBed } from '@angular/core/testing';
import { Reports } from './reports';

describe('Reports', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reports],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Reports);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
