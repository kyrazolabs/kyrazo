import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectorsPage } from './connectors.page';

describe('ConnectorsPage', () => {
  let component: ConnectorsPage;
  let fixture: ComponentFixture<ConnectorsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConnectorsPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConnectorsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
