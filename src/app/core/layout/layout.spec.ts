import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { Layout } from './layout';

describe('Layout', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Layout],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Layout);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
