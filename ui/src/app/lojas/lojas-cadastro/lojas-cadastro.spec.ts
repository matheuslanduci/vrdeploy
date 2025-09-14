import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LojasCadastro } from './lojas-cadastro';

describe('LojasCadastro', () => {
  let component: LojasCadastro;
  let fixture: ComponentFixture<LojasCadastro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LojasCadastro]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LojasCadastro);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
