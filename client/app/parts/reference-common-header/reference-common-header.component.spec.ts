import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReferenceCommonHeaderComponent } from './reference-common-header.component';

describe('ReferenceCommonHeaderComponent', () => {
  let component: ReferenceCommonHeaderComponent;
  let fixture: ComponentFixture<ReferenceCommonHeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReferenceCommonHeaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReferenceCommonHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
