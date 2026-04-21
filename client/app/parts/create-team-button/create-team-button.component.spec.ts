import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateTeamButtonComponent } from './create-team-button.component';

describe('CreateTeamButtonComponent', () => {
  let component: CreateTeamButtonComponent;
  let fixture: ComponentFixture<CreateTeamButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateTeamButtonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateTeamButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
