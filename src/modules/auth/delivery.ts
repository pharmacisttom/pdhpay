export type ResetDelivery = (message: {
  to: string;
  url: string;
}) => Promise<void>;
let delivery: ResetDelivery | undefined;
// Configure once at server startup with a product-owned adapter. Never log message contents.
export function configureResetDelivery(adapter: ResetDelivery) {
  delivery = adapter;
}
export function resetDelivery() {
  return delivery;
}
