import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { InputMatchTeamDialogComponent } from './input-match-team-dialog.component';

describe('InputMatchTeamDialogComponent', () => {
  let component: InputMatchTeamDialogComponent;
  let fixture: ComponentFixture<InputMatchTeamDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InputMatchTeamDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputMatchTeamDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
