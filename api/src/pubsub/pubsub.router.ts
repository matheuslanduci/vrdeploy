import { User } from 'better-auth'
import { WSEvents } from 'hono/ws'
import { Agente } from '~/agente/agente.sql'
import {
  generateAgenteChannelName,
  generateUserChannelName,
  publisher,
  registerAgente,
  registerUser,
  renewAgente,
  subscriber,
  unregisterAgente,
  unregisterUser
} from './pubsub'
import { agenteMessage, userMessage } from './ws-message'

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
          case 'publish': {
            switch (message.event) {
              case 'pty:output': {
                const channel = `session:${agente.id}:output`

                publisher.publish(channel, JSON.stringify(message.data))
              }
            }
            break
          }
          case 'subscribe': {
            const channel = generateAgenteChannelName(agente.id, message.event)

            // TODO: Corrigir isso no futuro para evitar múltiplas inscrições
            subscriber.subscribe(channel).then(() => {
              subscriber.on('message', (chan, data) => {
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

export function pubsubUserHandler(user: User) {
  return {
    onOpen: () => {
      registerUser(user.id)
    },
    onClose: () => {
      unregisterUser(user.id)
    },
    onMessage: (event, ws) => {
      try {
        const validation = userMessage.safeParse(
          typeof event.data === 'string' ? JSON.parse(event.data) : event.data
        )

        if (!validation.success) {
          console.error(event.data)
          ws.send('Mensagem inválida')
          return
        }

        const message = validation.data

        switch (message.type) {
          case 'publish': {
            switch (message.event) {
              case 'pty:input': {
                const channel = `agente:${message.data.idAgente}:pty:input`

                publisher.publish(channel, JSON.stringify(message.data))
              }
            }

            break
          }
          case 'subscribe': {
            // TODO: Add check de permissão aqui
            const channel = generateUserChannelName(user.id, message)

            console.log('Subscribing to channel', channel)

            // TODO: Corrigir isso no futuro para evitar múltiplas inscrições
            subscriber.subscribe(channel).then(() => {
              subscriber.on('message', (chan, data) => {
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
