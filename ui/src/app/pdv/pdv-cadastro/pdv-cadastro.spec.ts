import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdvCadastro } from './pdv-cadastro';

describe('PdvCadastro', () => {
  let component: PdvCadastro;
  let fixture: ComponentFixture<PdvCadastro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdvCadastro]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdvCadastro);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
