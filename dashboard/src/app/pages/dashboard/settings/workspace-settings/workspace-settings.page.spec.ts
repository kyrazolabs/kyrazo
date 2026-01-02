import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkspaceSettingsPage } from './workspace-settings.page';

describe('WorkspaceSettingsPage', () => {
  let component: WorkspaceSettingsPage;
  let fixture: ComponentFixture<WorkspaceSettingsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkspaceSettingsPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkspaceSettingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
