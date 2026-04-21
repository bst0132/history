import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { InputTeamDialogComponent } from './input-team-dialog.component';

describe('InputTeamDialogComponent', () => {
  let component: InputTeamDialogComponent;
  let fixture: ComponentFixture<InputTeamDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InputTeamDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputTeamDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
