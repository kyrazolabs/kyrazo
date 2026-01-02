import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EndpointsPage } from './endpoints.page';

describe('EndpointsPage', () => {
  let component: EndpointsPage;
  let fixture: ComponentFixture<EndpointsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EndpointsPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EndpointsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
