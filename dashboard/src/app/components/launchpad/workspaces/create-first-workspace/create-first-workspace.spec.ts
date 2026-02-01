import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateFirstWorkspace } from './create-first-workspace';

describe('CreateFirstWorkspace', () => {
    let component: CreateFirstWorkspace;
    let fixture: ComponentFixture<CreateFirstWorkspace>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CreateFirstWorkspace],
        }).compileComponents();

        fixture = TestBed.createComponent(CreateFirstWorkspace);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
