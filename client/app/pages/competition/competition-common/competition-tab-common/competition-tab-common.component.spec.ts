import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CompetitionTabCommonComponent } from './competition-tab-common.component';

describe('CompetitionTabCommonComponent', () => {
  let component: CompetitionTabCommonComponent;
  let fixture: ComponentFixture<CompetitionTabCommonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CompetitionTabCommonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompetitionTabCommonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
