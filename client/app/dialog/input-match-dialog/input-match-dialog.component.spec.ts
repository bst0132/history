import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { InputMatchDialogComponent } from './input-match-dialog.component';

describe('InputMatchDialogComponent', () => {
  let component: InputMatchDialogComponent;
  let fixture: ComponentFixture<InputMatchDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InputMatchDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputMatchDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
