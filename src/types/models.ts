import type { Timestamp } from 'firebase/firestore';

export type StudentStatus = 'active' | 'inactive';

export interface Student {
  id: string;
  ownerUid: string;
  name: string;
  nameNormalized: string;
  fatherName: string;
  fatherNameNormalized: string;
  className: string;
  section?: string;
  mobile?: string;
  mobileNormalized?: string;
  admissionNumber: string;
  admissionNumberNormalized: string;
  status: StudentStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ChargeType =
  | 'MONTHLY_FEE'
  | 'BOOKS'
  | 'DRESS'
  | 'ADMISSION'
  | 'TRANSPORT'
  | 'EXAM'
  | 'OTHER';

export interface Charge {
  id: string;
  ownerUid: string;
  studentId: string;
  type: ChargeType;
  description: string;
  amountPaise: number;
  chargeDate: Timestamp;
  feeMonth?: string;
  academicSession?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type PaymentMode = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER';

export interface Payment {
  id: string;
  ownerUid: string;
  studentId: string;
  amountPaise: number;
  paymentDate: Timestamp;
  paymentMode: PaymentMode;
  referenceNumber?: string;
  note?: string;
  receiptNumber: string;
  createdAt: Timestamp;
}
