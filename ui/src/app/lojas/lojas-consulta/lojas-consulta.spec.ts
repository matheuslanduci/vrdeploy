import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LojasConsulta } from './lojas-consulta';

describe('LojasConsulta', () => {
  let component: LojasConsulta;
  let fixture: ComponentFixture<LojasConsulta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LojasConsulta]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LojasConsulta);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
