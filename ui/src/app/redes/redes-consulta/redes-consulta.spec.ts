import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RedesConsulta } from './redes-consulta';

describe('RedesConsulta', () => {
  let component: RedesConsulta;
  let fixture: ComponentFixture<RedesConsulta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RedesConsulta]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RedesConsulta);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
