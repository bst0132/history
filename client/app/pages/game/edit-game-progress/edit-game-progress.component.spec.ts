import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditGameProgressComponent } from './edit-game-progress.component';

describe('EditGameProgressComponent', () => {
  let component: EditGameProgressComponent;
  let fixture: ComponentFixture<EditGameProgressComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditGameProgressComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditGameProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
