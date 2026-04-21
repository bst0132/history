import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageTmOrgListComponent } from './manage-tm-org-list.component';

describe('ManageTmOrgListComponent', () => {
  let component: ManageTmOrgListComponent;
  let fixture: ComponentFixture<ManageTmOrgListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ManageTmOrgListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageTmOrgListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
