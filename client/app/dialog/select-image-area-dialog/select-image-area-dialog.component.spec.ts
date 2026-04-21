import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectImageAreaDialogComponent } from './select-image-area-dialog.component';

describe('SelectImageAreaDialogComponent', () => {
  let component: SelectImageAreaDialogComponent;
  let fixture: ComponentFixture<SelectImageAreaDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectImageAreaDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectImageAreaDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
