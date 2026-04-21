import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReferenceCompetitionTournamentComponent } from './reference-competition-tournament.component';

describe('ReferenceCompetitionTournamentComponent', () => {
  let component: ReferenceCompetitionTournamentComponent;
  let fixture: ComponentFixture<ReferenceCompetitionTournamentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReferenceCompetitionTournamentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReferenceCompetitionTournamentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
