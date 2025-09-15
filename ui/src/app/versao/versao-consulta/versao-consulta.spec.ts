import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VersaoConsulta } from './versao-consulta';

describe('VersaoConsulta', () => {
  let component: VersaoConsulta;
  let fixture: ComponentFixture<VersaoConsulta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VersaoConsulta]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VersaoConsulta);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
