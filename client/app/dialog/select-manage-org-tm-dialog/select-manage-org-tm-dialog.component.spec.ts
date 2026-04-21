import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectManageOrgTmDialogComponent } from './select-manage-org-tm-dialog.component';

describe('SelectManageOrgTmDialogComponent', () => {
  let component: SelectManageOrgTmDialogComponent;
  let fixture: ComponentFixture<SelectManageOrgTmDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectManageOrgTmDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectManageOrgTmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
