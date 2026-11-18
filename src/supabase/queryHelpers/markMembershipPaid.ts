import { supabase } from '../client';

export type ManualPaymentMethod = 'manual' | 'bank' | 'cash' | 'vipps';

export interface ManualPayment {
  memberId: string;
  /** Bookkeeping snapshot of who paid, kept if the member is later erased. */
  payerName: string;
  season: number;
  amountNok: number;
  method: ManualPaymentMethod;
  /** ISO date (yyyy-mm-dd). */
  paidOn: string;
  note?: string;
}

/** The board's manual "paid" tick: one row in `membership_payments`. `marked_by` is set by the
 *  database from the caller's session, and the audit trigger logs it. */
export async function markMembershipPaid(payment: ManualPayment): Promise<void> {
  const { error } = await supabase.from('membership_payments').insert({
    member_id: payment.memberId,
    payer_name: payment.payerName,
    season: payment.season,
    amount_nok: payment.amountNok,
    method: payment.method,
    status: 'paid',
    paid_at: `${payment.paidOn}T12:00:00Z`,
    note: payment.note?.trim() || null,
  });

  if (error) throw error;
}
