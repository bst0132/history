import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NotReceiveMailComponent } from './not-receive-mail.component';

describe('NotReceiveMailComponent', () => {
  let component: NotReceiveMailComponent;
  let fixture: ComponentFixture<NotReceiveMailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NotReceiveMailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotReceiveMailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
