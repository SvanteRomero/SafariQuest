import { apiGet, apiPatch, apiPost } from '../lib/api'
import type { Currency } from '../lib/money'
import type { BookingStage } from './bookings'

/** How a commission was paid. Agents choose between mobile money and bank transfer. */
export type PayoutMethod = 'mobile_money' | 'bank_transfer' | 'cash' | 'other'

export const PAYOUT_METHOD_LABELS: Record<PayoutMethod, string> = {
  mobile_money: 'Mobile money',
  bank_transfer: 'Bank transfer',
  cash: 'Cash',
  other: 'Other',
}

/** A paid commission's record: when, how, with what reference. */
export interface PayoutRecord {
  paidAt: string | null
  payoutMethod: PayoutMethod | ''
  payoutReference: string
}

export interface ReferralRedemptionSummary extends PayoutRecord {
  bookingId: number
  commissionAmount: number
  /** Commission is in the booking's currency. */
  currency: Currency
  commissionStatus: 'pending' | 'paid'
  createdAt: string
  /** Commission is paid once the trip is completed. */
  tripCompleted: boolean
}

export interface ReferralCode {
  id: number
  code: string
  contactName: string
  status: 'active' | 'used' | 'expired'
  createdAt: string
  expiresAt: string
  usedAt: string | null
  redemption: ReferralRedemptionSummary | null
}

interface ReferralCodeApiShape {
  id: number
  code: string
  contact_name: string
  status: 'active' | 'used' | 'expired'
  created_at: string
  expires_at: string
  used_at: string | null
  redemption: {
    bookingId: number
    commission_amount: number
    currency: Currency
    commission_status: 'pending' | 'paid'
    created_at: string
    trip_completed: boolean
    paid_at: string | null
    payout_method: PayoutMethod | ''
    payout_reference: string
  } | null
}

function normalizeCode(raw: ReferralCodeApiShape): ReferralCode {
  return {
    id: raw.id,
    code: raw.code,
    contactName: raw.contact_name,
    status: raw.status,
    createdAt: raw.created_at,
    expiresAt: raw.expires_at,
    usedAt: raw.used_at,
    redemption: raw.redemption
      ? {
          bookingId: raw.redemption.bookingId,
          commissionAmount: raw.redemption.commission_amount,
          currency: raw.redemption.currency,
          commissionStatus: raw.redemption.commission_status,
          createdAt: raw.redemption.created_at,
          tripCompleted: raw.redemption.trip_completed,
          paidAt: raw.redemption.paid_at,
          payoutMethod: raw.redemption.payout_method,
          payoutReference: raw.redemption.payout_reference,
        }
      : null,
  }
}

/** New visitors only: creates a tourist account with the agent profile already on,
 * and signs them in. Refuses an email that already has an account. */
export async function registerAgent(input: { email: string; name: string; password: string }): Promise<void> {
  await apiPost<unknown>('/api/referrals/agents/register/', input)
}

/** Switches the agent profile on for the signed-in tourist. Safe to call twice. */
export async function activateReferralAgent(): Promise<void> {
  await apiPost<unknown>('/api/referrals/agents/activate/')
}

export async function generateReferralCode(contactName?: string): Promise<ReferralCode> {
  const raw = await apiPost<ReferralCodeApiShape>('/api/referrals/codes/', { contact_name: contactName ?? '' })
  return normalizeCode(raw)
}

export async function getMyReferralCodes(): Promise<ReferralCode[]> {
  const raw = await apiGet<ReferralCodeApiShape[]>('/api/referrals/codes/mine/')
  return raw.map(normalizeCode)
}

export async function validateReferralCode(code: string): Promise<{ discountPercent: number }> {
  const raw = await apiPost<{ discountPercent: string }>('/api/referrals/codes/validate/', { code })
  return { discountPercent: Number(raw.discountPercent) }
}

export interface ReferralSettings {
  discountPercent: number
  commissionPercent: number
  codeExpiryDays: number
}

interface ReferralSettingsApiShape {
  discount_percent: string
  commission_percent: string
  code_expiry_days: number
}

function toReferralSettings(raw: ReferralSettingsApiShape): ReferralSettings {
  return {
    discountPercent: Number(raw.discount_percent),
    commissionPercent: Number(raw.commission_percent),
    codeExpiryDays: raw.code_expiry_days,
  }
}

/** Rates shown to visitors on the Refer & Earn pages — no auth required. */
export async function getPublicReferralSettings(): Promise<ReferralSettings> {
  return toReferralSettings(await apiGet<ReferralSettingsApiShape>('/api/referrals/settings/public/'))
}

export async function getReferralSettings(): Promise<ReferralSettings> {
  return toReferralSettings(await apiGet<ReferralSettingsApiShape>('/api/referrals/settings/'))
}

export async function updateReferralSettings(input: {
  discountPercent: number
  commissionPercent: number
  codeExpiryDays: number
}): Promise<ReferralSettings> {
  const raw = await apiPatch<ReferralSettingsApiShape>('/api/referrals/settings/', {
    discount_percent: input.discountPercent,
    commission_percent: input.commissionPercent,
    code_expiry_days: input.codeExpiryDays,
  })
  return toReferralSettings(raw)
}

export interface ReferralRedemption extends PayoutRecord {
  id: number
  agentId: number
  tripStage: BookingStage
  tripEndDate: string
  /** Pending, on a completed trip: can be paid now. */
  payable: boolean
  paidBy: string | null
  agentName: string
  agentEmail: string
  code: string
  bookingId: number
  customerName: string
  customerEmail: string
  tripTotal: number
  discountPercent: number
  commissionPercent: number
  commissionAmount: number
  currency: Currency
  commissionStatus: 'pending' | 'paid'
  createdAt: string
}

interface ReferralRedemptionApiShape {
  id: number
  agentName: string
  agentEmail: string
  code: string
  bookingId: number
  customerName: string
  customerEmail: string
  trip_total: number
  discount_percent: string
  commission_percent: string
  commission_amount: number
  currency: Currency
  commission_status: 'pending' | 'paid'
  created_at: string
  agentId: number
  trip_stage: BookingStage
  trip_end_date: string
  payable: boolean
  paid_at: string | null
  paid_by: string | null
  payout_method: PayoutMethod | ''
  payout_reference: string
}

function normalizeRedemption(raw: ReferralRedemptionApiShape): ReferralRedemption {
  return {
    id: raw.id,
    agentName: raw.agentName,
    agentEmail: raw.agentEmail,
    code: raw.code,
    bookingId: raw.bookingId,
    customerName: raw.customerName,
    customerEmail: raw.customerEmail,
    tripTotal: raw.trip_total,
    discountPercent: Number(raw.discount_percent),
    commissionPercent: Number(raw.commission_percent),
    commissionAmount: raw.commission_amount,
    currency: raw.currency,
    commissionStatus: raw.commission_status,
    createdAt: raw.created_at,
    agentId: raw.agentId,
    tripStage: raw.trip_stage,
    tripEndDate: raw.trip_end_date,
    payable: raw.payable,
    paidAt: raw.paid_at,
    paidBy: raw.paid_by,
    payoutMethod: raw.payout_method,
    payoutReference: raw.payout_reference,
  }
}

export async function getReferralRedemptions(): Promise<ReferralRedemption[]> {
  const raw = await apiGet<{ results: ReferralRedemptionApiShape[] } | ReferralRedemptionApiShape[]>(
    '/api/referrals/admin/redemptions/',
  )
  const list = Array.isArray(raw) ? raw : raw.results
  return list.map(normalizeRedemption)
}

export interface PayoutInput {
  method: PayoutMethod
  reference: string
}

/** Records that one commission was paid (only once its trip is completed). */
export async function markCommissionPaid(id: number, payout: PayoutInput): Promise<ReferralRedemption> {
  const raw = await apiPost<ReferralRedemptionApiShape>(`/api/referrals/admin/redemptions/${id}/mark-paid/`, payout)
  return normalizeRedemption(raw)
}

/** Where an agent wants commission sent. */
export interface AgentPayoutDetails {
  method: Extract<PayoutMethod, 'mobile_money' | 'bank_transfer'>
  accountName: string
  accountDetails: string
  updatedAt?: string
}

interface AgentPayoutDetailsApiShape {
  method: AgentPayoutDetails['method']
  account_name: string
  account_details: string
  updated_at: string
}

function toPayoutDetails(raw: AgentPayoutDetailsApiShape): AgentPayoutDetails {
  return {
    method: raw.method,
    accountName: raw.account_name,
    accountDetails: raw.account_details,
    updatedAt: raw.updated_at,
  }
}

export async function getMyPayoutDetails(): Promise<AgentPayoutDetails | null> {
  const raw = await apiGet<AgentPayoutDetailsApiShape | null>('/api/referrals/payout-details/')
  return raw ? toPayoutDetails(raw) : null
}

export async function saveMyPayoutDetails(details: AgentPayoutDetails): Promise<AgentPayoutDetails> {
  const raw = await apiPatch<AgentPayoutDetailsApiShape>('/api/referrals/payout-details/', {
    method: details.method,
    account_name: details.accountName,
    account_details: details.accountDetails,
  })
  return toPayoutDetails(raw)
}

/** Commission totals in one currency (never added across currencies). */
export interface CommissionTotals {
  payable: number
  awaiting: number
  paid: number
}

export interface AgentPayoutSummary {
  agentId: number
  name: string
  email: string
  referrals: number
  totals: Partial<Record<Currency, CommissionTotals>>
  payoutDetails: AgentPayoutDetails | null
}

interface AgentPayoutSummaryApiShape {
  agent_id: number
  name: string
  email: string
  referrals: number
  totals: Partial<Record<Currency, CommissionTotals>>
  payout_details: AgentPayoutDetailsApiShape | null
}

export async function getAgentPayoutSummaries(): Promise<AgentPayoutSummary[]> {
  const raw = await apiGet<AgentPayoutSummaryApiShape[]>('/api/referrals/admin/agents/')
  return raw.map((a) => ({
    agentId: a.agent_id,
    name: a.name,
    email: a.email,
    referrals: a.referrals,
    totals: a.totals,
    payoutDetails: a.payout_details ? toPayoutDetails(a.payout_details) : null,
  }))
}

/** One payout covering everything payable to the agent in `currency`. */
export async function payAgent(
  agentId: number,
  currency: Currency,
  payout: PayoutInput,
): Promise<{ paid: number; total: number }> {
  return apiPost<{ paid: number; total: number }>(`/api/referrals/admin/agents/${agentId}/pay/`, {
    ...payout,
    currency,
  })
}
