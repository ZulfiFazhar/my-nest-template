export interface ApiResponse<T = unknown> {
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

export interface HealthCheckData {
  status: string;
  database: 'connected' | 'disconnected';
  timestamp: string;
  uptime: number;
}
