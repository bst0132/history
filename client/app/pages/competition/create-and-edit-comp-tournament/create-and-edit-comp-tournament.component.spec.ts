import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAndEditCompTournamentComponent } from './create-and-edit-comp-tournament.component';

describe('CreateAndEditCompTournamentComponent', () => {
  let component: CreateAndEditCompTournamentComponent;
  let fixture: ComponentFixture<CreateAndEditCompTournamentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateAndEditCompTournamentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateAndEditCompTournamentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
