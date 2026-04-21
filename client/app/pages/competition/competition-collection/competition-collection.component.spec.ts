import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CompetitionCollectionComponent } from './competition-collection.component';

describe('CompetitionCollectionComponent', () => {
  let component: CompetitionCollectionComponent;
  let fixture: ComponentFixture<CompetitionCollectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CompetitionCollectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompetitionCollectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
