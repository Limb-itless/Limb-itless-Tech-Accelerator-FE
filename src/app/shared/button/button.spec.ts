import { TestBed } from '@angular/core/testing';
import { Button } from './button';

describe('Button', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Button],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Button);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('emits pressed on click', () => {
    const fixture = TestBed.createComponent(Button);
    fixture.detectChanges();

    let pressed = false;
    fixture.componentInstance.pressed.subscribe(() => (pressed = true));
    fixture.nativeElement.querySelector('button').click();

    expect(pressed).toBe(true);
  });
});
