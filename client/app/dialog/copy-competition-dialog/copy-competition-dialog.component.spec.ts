import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CopyCompetitionDialogComponent } from './copy-competition-dialog.component';

describe('CopyCompetitionDialogComponent', () => {
  let component: CopyCompetitionDialogComponent;
  let fixture: ComponentFixture<CopyCompetitionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CopyCompetitionDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CopyCompetitionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
