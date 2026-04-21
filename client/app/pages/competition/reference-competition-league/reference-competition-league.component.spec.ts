import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReferenceCompetitionLeagueComponent } from './reference-competition-league.component';

describe('ReferenceCompetitionLeagueComponent', () => {
  let component: ReferenceCompetitionLeagueComponent;
  let fixture: ComponentFixture<ReferenceCompetitionLeagueComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReferenceCompetitionLeagueComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReferenceCompetitionLeagueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
