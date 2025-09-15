import { provideHttpClient } from '@angular/common/http'
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection
} from '@angular/core'
import { provideAnimations } from '@angular/platform-browser/animations'
import { provideRouter } from '@angular/router'
import { IconDefinition } from '@ant-design/icons-angular'
import {
  ApartmentOutline,
  CloseOutline,
  DeleteOutline,
  DesktopOutline,
  EditOutline,
  EyeInvisibleOutline,
  EyeOutline,
  LayoutOutline,
  LinkOutline,
  LinuxOutline,
  PlusOutline,
  UserOutline,
  WifiOutline,
  WindowsFill
} from '@ant-design/icons-angular/icons'
import { provideNzI18n, pt_BR } from 'ng-zorro-antd/i18n'
import { provideNzIcons } from 'ng-zorro-antd/icon'
import { routes } from './app.routes'

const icons: IconDefinition[] = [
  EyeOutline,
  EyeInvisibleOutline,
  LayoutOutline,
  ApartmentOutline,
  UserOutline,
  PlusOutline,
  EditOutline,
  DeleteOutline,
  DesktopOutline,
  WindowsFill,
  LinuxOutline,
  CloseOutline,
  WifiOutline,
  LinkOutline
]

export const appConfig: ApplicationConfig = {
  providers: [
    provideNzIcons(icons),
    provideNzI18n(pt_BR),
    provideHttpClient(),
    provideAnimations(),
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes)
  ]
}
