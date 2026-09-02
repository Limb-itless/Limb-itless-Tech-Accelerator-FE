import { TestBed } from '@angular/core/testing';
import { Users } from './users';

describe('Users', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Users],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Users);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
