import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RedesEdicao } from './redes-edicao';

describe('RedesEdicao', () => {
  let component: RedesEdicao;
  let fixture: ComponentFixture<RedesEdicao>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RedesEdicao]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RedesEdicao);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
