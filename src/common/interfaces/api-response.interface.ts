export interface ApiResponse<T = unknown> {
  message: string;
  data: T;
}

export interface HealthCheckData {
  status: string;
  database: 'connected' | 'disconnected';
  timestamp: string;
  uptime: number;
}
