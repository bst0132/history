import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditGameMemberComponent } from './edit-game-member.component';

describe('EditGameMemberComponent', () => {
  let component: EditGameMemberComponent;
  let fixture: ComponentFixture<EditGameMemberComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditGameMemberComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditGameMemberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
