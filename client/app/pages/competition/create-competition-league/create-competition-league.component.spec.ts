import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateCompetitionLeagueComponent } from './create-competition-league.component';

describe('CreateCompetitionLeagueComponent', () => {
  let component: CreateCompetitionLeagueComponent;
  let fixture: ComponentFixture<CreateCompetitionLeagueComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateCompetitionLeagueComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateCompetitionLeagueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
