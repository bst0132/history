import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganDetailComponent } from './organ-detail.component';

describe('OrganDetailComponent', () => {
  let component: OrganDetailComponent;
  let fixture: ComponentFixture<OrganDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OrganDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrganDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
