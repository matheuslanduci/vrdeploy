import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RedesCadastro } from './redes-cadastro';

describe('RedesCadastro', () => {
  let component: RedesCadastro;
  let fixture: ComponentFixture<RedesCadastro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RedesCadastro]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RedesCadastro);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
