import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InviteOrganComponent } from './invite-organ.component';

describe('InviteOrganComponent', () => {
  let component: InviteOrganComponent;
  let fixture: ComponentFixture<InviteOrganComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InviteOrganComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InviteOrganComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
