import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageOrganInfComponent } from './manage-organ-inf.component';

describe('ManageOrganInfComponent', () => {
  let component: ManageOrganInfComponent;
  let fixture: ComponentFixture<ManageOrganInfComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ManageOrganInfComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageOrganInfComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
