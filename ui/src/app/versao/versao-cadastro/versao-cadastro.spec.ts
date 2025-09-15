import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VersaoCadastro } from './versao-cadastro';

describe('VersaoCadastro', () => {
  let component: VersaoCadastro;
  let fixture: ComponentFixture<VersaoCadastro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VersaoCadastro]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VersaoCadastro);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
