import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageCompListComponent } from './manage-comp-list.component';

describe('ManageCompListComponent', () => {
  let component: ManageCompListComponent;
  let fixture: ComponentFixture<ManageCompListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ManageCompListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageCompListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
