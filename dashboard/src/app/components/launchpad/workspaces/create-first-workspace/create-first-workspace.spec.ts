import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateFirstWorksapce } from './create-first-worksapce';

describe('CreateFirstWorksapce', () => {
  let component: CreateFirstWorksapce;
  let fixture: ComponentFixture<CreateFirstWorksapce>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateFirstWorksapce]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateFirstWorksapce);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
