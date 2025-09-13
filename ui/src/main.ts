import { registerLocaleData } from '@angular/common'
import pt from '@angular/common/locales/pt'
import { bootstrapApplication } from '@angular/platform-browser'
import { App } from './app/app'
import { appConfig } from './app/app.config'

registerLocaleData(pt)

bootstrapApplication(App, appConfig).catch((err) => console.error(err))
