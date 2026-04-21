import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InviteTeamComponent } from './invite-team.component';

describe('InviteTeamComponent', () => {
  let component: InviteTeamComponent;
  let fixture: ComponentFixture<InviteTeamComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InviteTeamComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InviteTeamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
