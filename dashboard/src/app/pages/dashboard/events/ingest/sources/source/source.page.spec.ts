import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SourcePage } from './source.page';

describe('SourcePage', () => {
  let component: SourcePage;
  let fixture: ComponentFixture<SourcePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SourcePage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SourcePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
