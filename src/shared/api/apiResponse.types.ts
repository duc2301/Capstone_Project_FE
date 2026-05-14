export interface ApiResponse<T = unknown> {
  message: string;
  isSuccess: boolean;
  result: T | null;
  errors: unknown | null;
}
