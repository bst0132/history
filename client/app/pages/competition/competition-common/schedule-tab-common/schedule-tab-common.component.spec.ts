import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ScheduleTabCommonComponent } from './schedule-tab-common.component';

describe('ScheduleTabCommonComponent', () => {
  let component: ScheduleTabCommonComponent;
  let fixture: ComponentFixture<ScheduleTabCommonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ScheduleTabCommonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScheduleTabCommonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
