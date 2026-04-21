import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReferenceCompetitionGuideComponent } from './reference-competition-guide.component';

describe('ReferenceCompetitionGuideComponent', () => {
  let component: ReferenceCompetitionGuideComponent;
  let fixture: ComponentFixture<ReferenceCompetitionGuideComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReferenceCompetitionGuideComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReferenceCompetitionGuideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
