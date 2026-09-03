export type ApiResponse<T> = {
  data?: T;
  error?: string;
};

export function ok<T>(data: T): ApiResponse<T> {
  return { data };
}

export function fail(error: string): ApiResponse<never> {
  return { error };
}
