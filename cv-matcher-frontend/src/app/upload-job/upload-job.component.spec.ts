import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadJobComponent } from './upload-job.component';

describe('UploadJobComponent', () => {
  let component: UploadJobComponent;
  let fixture: ComponentFixture<UploadJobComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadJobComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadJobComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
