import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Student } from '../types/models';

const studentsCollection = collection(db, 'students');

export async function addStudent(student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) {
  const docRef = await addDoc(studentsCollection, {
    ...student,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateStudent(studentId: string, data: Partial<Omit<Student, 'id'>>) {
  const docRef = doc(db, 'students', studentId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function getStudents(ownerUid: string): Promise<Student[]> {
  const q = query(studentsCollection, where('ownerUid', '==', ownerUid));
  const querySnapshot = await getDocs(q);
  const list = querySnapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...(docSnapshot.data() as Omit<Student, 'id'>),
  })) as Student[];
  
  // Sort in memory by createdAt descending
  return list.sort((a, b) => {
    const timeA = a.createdAt?.seconds || 0;
    const timeB = b.createdAt?.seconds || 0;
    return timeB - timeA;
  });
}

export async function getStudentById(studentId: string): Promise<Student | null> {
  const docRef = doc(db, 'students', studentId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists()
    ? ({ id: docSnap.id, ...(docSnap.data() as Omit<Student, 'id'>) } as Student)
    : null;
}

export async function searchStudentsByName(ownerUid: string, search: string): Promise<Student[]> {
  const normalizedSearch = search.trim().toUpperCase();
  const q = query(studentsCollection, where('ownerUid', '==', ownerUid));
  const querySnapshot = await getDocs(q);
  const list = querySnapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...(docSnapshot.data() as Omit<Student, 'id'>),
  })) as Student[];

  // Filter by name (case-insensitive fuzzy substring search) and sort alphabetically
  return list
    .filter((student) => student.nameNormalized && student.nameNormalized.includes(normalizedSearch))
    .sort((a, b) => a.nameNormalized.localeCompare(b.nameNormalized));
}

export async function fetchDashboardCounts(ownerUid: string) {
  const chargesCollection = collection(db, 'charges');
  const paymentsCollection = collection(db, 'payments');
  const [studentsSnapshot, chargesSnapshot, paymentsSnapshot] = await Promise.all([
    getDocs(query(studentsCollection, where('ownerUid', '==', ownerUid))),
    getDocs(query(chargesCollection, where('ownerUid', '==', ownerUid))),
    getDocs(query(paymentsCollection, where('ownerUid', '==', ownerUid))),
  ]);
  return {
    totalStudents: studentsSnapshot.size,
    totalCharges: chargesSnapshot.docs.reduce((sum, docSnap) => sum + ((docSnap.data() as { amountPaise: number }).amountPaise ?? 0), 0),
    totalPaid: paymentsSnapshot.docs.reduce((sum, docSnap) => sum + ((docSnap.data() as { amountPaise: number }).amountPaise ?? 0), 0),
  };
}
