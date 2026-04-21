import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CompleteScreenComponent } from './complete-screen.component';

describe('CompleteScreenComponent', () => {
  let component: CompleteScreenComponent;
  let fixture: ComponentFixture<CompleteScreenComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CompleteScreenComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompleteScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
