'use server';

import { resendPaymentLink as resendPaymentLinkAction } from '../actions';

export async function resendPaymentLink(reservationId: string) {
  return resendPaymentLinkAction(reservationId);
}
