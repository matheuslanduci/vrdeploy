import { ComponentFixture, TestBed } from '@angular/core/testing'

import { ImplantacaoConsulta } from './implantacao-consulta'

describe('ImplantacaoConsulta', () => {
  let component: ImplantacaoConsulta
  let fixture: ComponentFixture<ImplantacaoConsulta>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImplantacaoConsulta]
    }).compileComponents()

    fixture = TestBed.createComponent(ImplantacaoConsulta)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
