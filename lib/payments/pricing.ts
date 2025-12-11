type PriceEntry = {
  id: string;
  tier: "pro";
  cadence: "month" | "year";
};

const MONTHLY_PRICE = process.env.STRIPE_PRICE_PRO_MONTH;
const YEARLY_PRICE = process.env.STRIPE_PRICE_PRO_YEAR;

const priceAllowlist: PriceEntry[] = [
  MONTHLY_PRICE ? { id: MONTHLY_PRICE, tier: "pro", cadence: "month" } : null,
  YEARLY_PRICE ? { id: YEARLY_PRICE, tier: "pro", cadence: "year" } : null,
].filter(Boolean) as PriceEntry[];

export function getAllowedPrice(priceId: string): PriceEntry | null {
  return priceAllowlist.find((price) => price.id === priceId) ?? null;
}

export function getAllowlistedPriceIds(): string[] {
  return priceAllowlist.map((price) => price.id);
}
