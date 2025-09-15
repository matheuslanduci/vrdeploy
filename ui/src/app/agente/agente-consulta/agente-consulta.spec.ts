import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgenteConsulta } from './agente-consulta';

describe('AgenteConsulta', () => {
  let component: AgenteConsulta;
  let fixture: ComponentFixture<AgenteConsulta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgenteConsulta]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgenteConsulta);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
