import type { HubConnection } from '@microsoft/signalr';
import {
  HttpTransportType,
  HubConnectionBuilder,
  LogLevel,
} from '@microsoft/signalr';

import { authStorage } from '@/shared/lib/storage';

const HUB_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function createHubConnection(hubPath: string): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(`${HUB_BASE_URL}${hubPath}`, {
      accessTokenFactory: () => authStorage.getAccessToken() ?? '',
      transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
      withCredentials: false,
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();
}
