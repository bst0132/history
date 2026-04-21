import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditGameResultComponent } from './edit-game-result.component';

describe('EditGameResultComponent', () => {
  let component: EditGameResultComponent;
  let fixture: ComponentFixture<EditGameResultComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditGameResultComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditGameResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
