import type { QuoteLineItemInput } from '../api/bookings'

/** A quote line being edited, with a stable key for React (rows can be added and
 * removed, so their position isn't an identity). The key never goes to the API. */
export interface DraftLineItem extends QuoteLineItemInput {
  key: string
}

let counter = 0

export function draftLine(item: QuoteLineItemInput = { label: '', quantity: 1, unitPrice: 0 }): DraftLineItem {
  counter += 1
  return { ...item, key: `line-${counter}` }
}

export function toLineInputs(items: DraftLineItem[]): QuoteLineItemInput[] {
  return items.map(({ label, quantity, unitPrice }) => ({ label, quantity, unitPrice }))
}
