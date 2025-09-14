import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdvEdicao } from './pdv-edicao';

describe('PdvEdicao', () => {
  let component: PdvEdicao;
  let fixture: ComponentFixture<PdvEdicao>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdvEdicao]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdvEdicao);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
