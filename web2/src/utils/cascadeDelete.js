// src/utils/cascadeDelete.js
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { COLLECTIONS, SURVEY_TYPES } from "./collectionConfig";
import { getIntegratedPatientDetail } from "./IntegratedFirebaseUtils";

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
 * - patients 또는 patients_patients 컬렉션에서 환자 삭제
 * - users 또는 patients_users 컬렉션에서 사용자 정보 삭제
 */
export async function deletePatientWithCascade(patientId) {
  // 1) 환자 타입 확인 (생존자 또는 암환자)
  const detail = await getIntegratedPatientDetail(patientId);
  const isPatient = detail?.type === SURVEY_TYPES.PATIENT;

  // 2) counselingRequests 삭제 (생존자용)
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

  // 3) patients_counselingRequests 삭제 (암환자용)
  if (isPatient) {
    const patientsReqRef = collection(
      db,
      COLLECTIONS.PATIENTS.COUNSELING_REQUESTS
    );
    const patientsQ = query(patientsReqRef, where("userId", "==", patientId));
    const patientsReqSnap = await getDocs(patientsQ);

    for (const d of patientsReqSnap.docs) {
      const requestId = d.id;
      // delete notes subcollection
      await deleteSubcollectionDocs(
        COLLECTIONS.PATIENTS.COUNSELING_REQUESTS,
        requestId,
        "notes"
      );
      // delete request doc
      await deleteDoc(
        doc(db, COLLECTIONS.PATIENTS.COUNSELING_REQUESTS, requestId)
      );
    }
  }

  // 4) users 또는 patients_users 삭제
  const usersCollection = isPatient
    ? COLLECTIONS.PATIENTS.USERS
    : COLLECTIONS.SURVIVORS.USERS;
  try {
    const userDoc = await getDoc(doc(db, usersCollection, patientId));
    if (userDoc.exists()) {
      await deleteDoc(doc(db, usersCollection, patientId));
    }
  } catch (error) {
    console.warn(`Failed to delete user from ${usersCollection}:`, error);
  }

  // 5) patients 또는 patients_patients 삭제
  const patientsCollection = isPatient
    ? COLLECTIONS.PATIENTS.PATIENTS
    : COLLECTIONS.SURVIVORS.PATIENTS;
  await deleteDoc(doc(db, patientsCollection, patientId));
}
