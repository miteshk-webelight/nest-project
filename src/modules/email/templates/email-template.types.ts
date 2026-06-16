export interface EmailTemplate<T = Record<string, unknown>> {
  subject: (...args: string[]) => string;
  html: (data: T) => string;
}
