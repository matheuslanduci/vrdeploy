import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LojasEdicao } from './lojas-edicao';

describe('LojasEdicao', () => {
  let component: LojasEdicao;
  let fixture: ComponentFixture<LojasEdicao>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LojasEdicao]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LojasEdicao);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
