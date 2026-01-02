import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InspectorPage } from './inspector.page';

describe('InspectorPage', () => {
  let component: InspectorPage;
  let fixture: ComponentFixture<InspectorPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InspectorPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InspectorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
