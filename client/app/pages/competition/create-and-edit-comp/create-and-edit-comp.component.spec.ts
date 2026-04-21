import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateAndEditCompComponent } from './create-and-edit-comp.component';

describe('CreateAndEditCompComponent', () => {
  let component: CreateAndEditCompComponent;
  let fixture: ComponentFixture<CreateAndEditCompComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateAndEditCompComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateAndEditCompComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
