import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CompetitionCommonTournamentComponent } from './competition-common-tournament.component';

describe('CompetitionCommonTournamentComponent', () => {
  let component: CompetitionCommonTournamentComponent;
  let fixture: ComponentFixture<CompetitionCommonTournamentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CompetitionCommonTournamentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompetitionCommonTournamentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
