import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectOrgDialogComponent } from './select-org-dialog.component';

describe('SelectOrgDialogComponent', () => {
  let component: SelectOrgDialogComponent;
  let fixture: ComponentFixture<SelectOrgDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectOrgDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectOrgDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
