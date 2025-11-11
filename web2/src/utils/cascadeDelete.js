// src/utils/cascadeDelete.js
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
} from "firebase/firestore";

async function deleteSubcollectionDocs(
  parentCollection,
  parentId,
  subcollection
) {
  const subRef = collection(db, parentCollection, parentId, subcollection);
  const snap = await getDocs(subRef);
  const tasks = [];
  snap.forEach((d) => tasks.push(deleteDoc(d.ref)));
  await Promise.all(tasks);
}

/**
 * 환자 삭제 시 연쇄 삭제 처리
 * - counselingRequests (userId == patientId)
 *   - notes 서브컬렉션도 함께 삭제
 * - TODO: surveyResults도 필요 시 동일 방식으로 추가 가능
 */
export async function deletePatientWithCascade(patientId) {
  // 1) counselingRequests for user
  const reqRef = collection(db, "counselingRequests");
  const q = query(reqRef, where("userId", "==", patientId));
  const reqSnap = await getDocs(q);

  for (const d of reqSnap.docs) {
    const requestId = d.id;
    // delete notes subcollection
    await deleteSubcollectionDocs("counselingRequests", requestId, "notes");
    // delete request doc
    await deleteDoc(doc(db, "counselingRequests", requestId));
  }

  // 2) finally delete patient
  await deleteDoc(doc(db, "patients", patientId));
}
