import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CompetitionGuideComponent } from './competition-guide.component';

describe('CompetitionGuideComponent', () => {
  let component: CompetitionGuideComponent;
  let fixture: ComponentFixture<CompetitionGuideComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CompetitionGuideComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompetitionGuideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
