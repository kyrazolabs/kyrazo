import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RefundPage } from './refund.page';

describe('RefundPage', () => {
  let component: RefundPage;
  let fixture: ComponentFixture<RefundPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RefundPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RefundPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
