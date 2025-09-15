import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VersaoEdicao } from './versao-edicao';

describe('VersaoEdicao', () => {
  let component: VersaoEdicao;
  let fixture: ComponentFixture<VersaoEdicao>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VersaoEdicao]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VersaoEdicao);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
