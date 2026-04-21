import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamHistoryListComponent } from './team-history-list.component';

describe('TeamHistoryListComponent', () => {
  let component: TeamHistoryListComponent;
  let fixture: ComponentFixture<TeamHistoryListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TeamHistoryListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TeamHistoryListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
