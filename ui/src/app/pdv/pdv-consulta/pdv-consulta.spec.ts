import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdvConsulta } from './pdv-consulta';

describe('PdvConsulta', () => {
  let component: PdvConsulta;
  let fixture: ComponentFixture<PdvConsulta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdvConsulta]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdvConsulta);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
