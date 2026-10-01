import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Motivation } from './motivation';

describe('Motivation', () => {
  let component: Motivation;
  let fixture: ComponentFixture<Motivation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Motivation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Motivation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
