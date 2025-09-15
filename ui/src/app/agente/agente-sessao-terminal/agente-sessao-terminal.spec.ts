import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgenteSessaoTerminal } from './agente-sessao-terminal';

describe('AgenteSessaoTerminal', () => {
  let component: AgenteSessaoTerminal;
  let fixture: ComponentFixture<AgenteSessaoTerminal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgenteSessaoTerminal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgenteSessaoTerminal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
