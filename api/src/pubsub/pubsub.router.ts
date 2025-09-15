import { WSEvents } from 'hono/ws'
import { Agente } from '~/agente/agente.sql'
import {
  createChannelName,
  registerAgente,
  renewAgente,
  subscriber,
  unregisterAgente
} from './pubsub'
import { agenteMessage } from './ws-message'

export function pubsubAgenteHandler(agente: Agente) {
  return {
    onOpen: () => {
      registerAgente(agente.id)
    },
    onClose: () => {
      unregisterAgente(agente.id)
    },
    onMessage: (event, ws) => {
      try {
        const validation = agenteMessage.safeParse(
          typeof event.data === 'string' ? JSON.parse(event.data) : event.data
        )

        if (!validation.success) {
          console.error(event.data)
          ws.send('Mensagem inválida')
          return
        }

        const message = validation.data

        switch (message.type) {
          case 'subscribe': {
            const channel = createChannelName(agente.id, message.event)

            // Corrigir isso no futuro para evitar múltiplas inscrições
            subscriber.subscribe(channel).then(() => {
              subscriber.on('message', (chan, data) => {
                console.log(chan === channel, chan, channel)
                if (chan === channel) {
                  ws.send(
                    JSON.stringify({
                      type: 'event',
                      event: message.event,
                      data
                    })
                  )
                }
              })
            })

            ws.send(
              JSON.stringify({
                type: 'subscribed',
                event: message.event
              })
            )

            break
          }
          case 'heartbeat': {
            renewAgente(agente.id)
            ws.send(
              JSON.stringify({
                type: 'ack'
              })
            )

            break
          }
        }
      } catch (err) {
        console.error(err)
        ws.send('Erro ao processar mensagem')
      }
    }
  } satisfies WSEvents
}
