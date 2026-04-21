import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ImageListPanelComponent } from './image-list-panel.component';

describe('ImageListPanelComponent', () => {
  let component: ImageListPanelComponent;
  let fixture: ComponentFixture<ImageListPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImageListPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageListPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
