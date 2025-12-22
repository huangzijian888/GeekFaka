import { PaymentAdapter } from "./types";
import { EpayProvider } from "./providers/epay";

// Map to hold singleton instances or classes
const adapters: Record<string, PaymentAdapter> = {};

// Register built-in providers
const epayProvider = new EpayProvider();
adapters[epayProvider.name] = epayProvider;

export function registerAdapter(adapter: PaymentAdapter) {
  adapters[adapter.name] = adapter;
}

export function getPaymentAdapter(name: string): PaymentAdapter {
  const adapter = adapters[name];
  if (!adapter) {
    throw new Error(`Payment adapter '${name}' not found.`);
  }
  return adapter;
}

export function getAvailablePaymentMethods() {
  return Object.keys(adapters).map(key => ({
    id: key,
    name: key.charAt(0).toUpperCase() + key.slice(1) // Capitalize
  }));
}
