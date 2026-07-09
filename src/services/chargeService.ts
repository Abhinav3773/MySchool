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
import type { Charge } from '../types/models';

const chargesCollection = collection(db, 'charges');

export async function addCharge(
  charge: Omit<Charge, 'id' | 'createdAt' | 'updatedAt' | 'chargeDate'> & { chargeDate: Date }
) {
  const docRef = await addDoc(chargesCollection, {
    ...charge,
    chargeDate: Timestamp.fromDate(charge.chargeDate),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getChargesByStudentId(ownerUid: string, studentId: string): Promise<Charge[]> {
  const q = query(
    chargesCollection,
    where('ownerUid', '==', ownerUid),
    where('studentId', '==', studentId)
  );
  const snapshot = await getDocs(q);
  const list = snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...(docSnapshot.data() as Omit<Charge, 'id'>),
  })) as Charge[];

  // Sort in memory by chargeDate descending
  return list.sort((a, b) => {
    const timeA = a.chargeDate?.seconds || 0;
    const timeB = b.chargeDate?.seconds || 0;
    return timeB - timeA;
  });
}

export async function getAllCharges(ownerUid: string): Promise<Charge[]> {
  const q = query(
    chargesCollection,
    where('ownerUid', '==', ownerUid)
  );
  const snapshot = await getDocs(q);
  const list = snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...(docSnapshot.data() as Omit<Charge, 'id'>),
  })) as Charge[];

  // Sort in memory by chargeDate descending
  return list.sort((a, b) => {
    const timeA = a.chargeDate?.seconds || 0;
    const timeB = b.chargeDate?.seconds || 0;
    return timeB - timeA;
  });
}
