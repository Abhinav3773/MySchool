import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Payment } from '../types/models';

const paymentsCollection = collection(db, 'payments');

export async function addPayment(
  payment: Omit<Payment, 'id' | 'createdAt' | 'paymentDate'> & { paymentDate: Date }
) {
  const docRef = await addDoc(paymentsCollection, {
    ...payment,
    paymentDate: Timestamp.fromDate(payment.paymentDate),
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getPaymentsByStudentId(ownerUid: string, studentId: string): Promise<Payment[]> {
  const q = query(
    paymentsCollection,
    where('ownerUid', '==', ownerUid),
    where('studentId', '==', studentId)
  );
  const snapshot = await getDocs(q);
  const list = snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...(docSnapshot.data() as Omit<Payment, 'id'>),
  })) as Payment[];

  // Sort in memory by paymentDate descending
  return list.sort((a, b) => {
    const timeA = a.paymentDate?.seconds || 0;
    const timeB = b.paymentDate?.seconds || 0;
    return timeB - timeA;
  });
}

export async function getAllPayments(ownerUid: string): Promise<Payment[]> {
  const q = query(
    paymentsCollection,
    where('ownerUid', '==', ownerUid)
  );
  const snapshot = await getDocs(q);
  const list = snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...(docSnapshot.data() as Omit<Payment, 'id'>),
  })) as Payment[];

  // Sort in memory by paymentDate descending
  return list.sort((a, b) => {
    const timeA = a.paymentDate?.seconds || 0;
    const timeB = b.paymentDate?.seconds || 0;
    return timeB - timeA;
  });
}
