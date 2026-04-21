import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ParticipatingTeamsTabCommonComponent } from './participating-teams-tab-common.component';

describe('ParticipatingTeamsTabCommonComponent', () => {
  let component: ParticipatingTeamsTabCommonComponent;
  let fixture: ComponentFixture<ParticipatingTeamsTabCommonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ParticipatingTeamsTabCommonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipatingTeamsTabCommonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
