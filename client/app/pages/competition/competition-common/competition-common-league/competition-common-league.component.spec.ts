import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CompetitionCommonLeagueComponent } from './competition-common-league.component';

describe('CompetitionCommonLeagueComponent', () => {
  let component: CompetitionCommonLeagueComponent;
  let fixture: ComponentFixture<CompetitionCommonLeagueComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CompetitionCommonLeagueComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompetitionCommonLeagueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
