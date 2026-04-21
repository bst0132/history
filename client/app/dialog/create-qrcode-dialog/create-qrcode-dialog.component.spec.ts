import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateQrcodeDialogComponent } from './create-qrcode-dialog.component';

describe('CreateQrcodeDialogComponent', () => {
  let component: CreateQrcodeDialogComponent;
  let fixture: ComponentFixture<CreateQrcodeDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateQrcodeDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateQrcodeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
