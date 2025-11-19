'use server';

import {
  resendPaymentLink as resendPaymentLinkAction,
  generateReservationContract as generateReservationContractAction,
} from '../actions';

export async function resendPaymentLink(reservationId: string) {
  return resendPaymentLinkAction(reservationId);
}

export async function generateReservationContract(reservationId: string) {
  return generateReservationContractAction(reservationId);
}
