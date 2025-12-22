import { PaymentAdapter } from "./types";
import { DummyProvider } from "./providers/dummy";

// Map to hold singleton instances or classes
const adapters: Record<string, PaymentAdapter> = {};

// Register built-in providers
const dummyProvider = new DummyProvider();
adapters[dummyProvider.name] = dummyProvider;

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
