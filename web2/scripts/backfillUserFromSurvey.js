/**
 * Backfill script: copy latest survey/profile answers into users/{uid}
 *
 * How to run (from project root or ./web2):
 *   node ./web2/scripts/backfillUserFromSurvey.js UID=<FIREBASE_UID>
 *   or
 *   node ./web2/scripts/backfillUserFromSurvey.js UID=<FIREBASE_UID> SURVEY_ID=<surveyResults doc id>
 *
 * Notes:
 * - This script reuses the front-end Firebase initialization (db) from src/firebase.
 * - Works in Node 18+ (fetch built-in). If you see ESM import issues, run via:
 *     node --experimental-modules ./web2/scripts/backfillUserFromSurvey.js UID=...
 */

import { db } from "../src/firebase";
import { PROFILE_KEYS, SURVEY_KEY_SOURCES } from "../src/models/patientProfile";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  orderBy,
  limit as qlimit,
  getDocs,
} from "firebase/firestore";

// --------- helpers ---------
const getArgKV = () => {
  const map = {};
  for (const pair of process.argv.slice(2)) {
    const [k, ...rest] = pair.split("=");
    if (!k) continue;
    map[k.trim()] = rest.join("=").trim();
  }
  return map;
};

const isFilled = (v) => {
  if (v === undefined || v === null) return false;
  if (typeof v === "string") {
    const s = v.trim();
    return s !== "" && s !== "-" && s !== "없음" && s !== "정보 없음";
  }
  return true;
};

const pick = (...vals) => {
  for (const v of vals) if (isFilled(v)) return v;
  return undefined;
};

// Read value from object by a dotted path (e.g., "profile.gender")
const readFromPaths = (obj, path) => {
  if (!obj || !path) return undefined;
  const parts = Array.isArray(path) ? path : String(path).split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
};

// Try a list of candidate paths and return the first filled value
const readMulti = (source, candidates = []) => {
  for (const c of candidates) {
    const v = typeof c === "function" ? c(source) : readFromPaths(source, c);
    if (isFilled(v)) return v;
  }
  return undefined;
};

async function findLatestSurveyForUser(uid) {
  const col = collection(db, "surveyResults");
  // Try by userId field
  const q1 = query(
    col,
    where("userId", "==", uid),
    orderBy("createdAt", "desc"),
    qlimit(1)
  );
  const s1 = await getDocs(q1);
  if (!s1.empty) return { id: s1.docs[0].id, data: s1.docs[0].data() };

  // Fallback: some older docs store uid as profile.uid
  const q2 = query(
    col,
    where("profile.uid", "==", uid),
    orderBy("createdAt", "desc"),
    qlimit(1)
  );
  const s2 = await getDocs(q2);
  if (!s2.empty) return { id: s2.docs[0].id, data: s2.docs[0].data() };

  return null;
}

async function backfill(uid, surveyId) {
  if (!uid) throw new Error("UID is required. Run with UID=<firebase uid>");

  let surveyDoc = null;
  if (surveyId) {
    const ref = doc(db, "surveyResults", surveyId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error(`surveyResults/${surveyId} not found`);
    surveyDoc = { id: snap.id, data: snap.data() };
  } else {
    const latest = await findLatestSurveyForUser(uid);
    if (!latest) throw new Error("No surveyResults found for this UID");
    surveyDoc = latest;
  }

  const { data } = surveyDoc;
  const profile = data.profile || {};
  const answers = data.answers || data.response || data.raw || {};

  // Unified source to read from: survey doc fields, nested profile, and answers
  const source = {
    ...data,
    profile,
    answers,
    // also spread first-level of answers to make both answers.q1 and q1 accessible
    ...(typeof answers === "object" ? answers : {}),
  };

  const patch = {};

  // Generic mapping based on SURVEY_KEY_SOURCES
  for (const key of PROFILE_KEYS) {
    const candidates = SURVEY_KEY_SOURCES[key] || [];
    const val = readMulti(source, candidates);
    if (isFilled(val)) patch[key] = val;
  }

  // Derive additional values
  // Age from birthDate if not already stored
  if (!patch.age && (patch.birthDate || profile.birthDate || data.birthDate)) {
    const bdStr = String(
      patch.birthDate || profile.birthDate || data.birthDate
    );
    const d = new Date(bdStr);
    if (!isNaN(d)) {
      const today = new Date();
      let age = today.getFullYear() - d.getFullYear();
      const m = today.getMonth() - d.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
      if (age >= 0) patch.age = age;
    }
  }

  // Drop empty
  Object.keys(patch).forEach((k) => {
    if (!isFilled(patch[k])) delete patch[k];
  });

  if (!Object.keys(patch).length) {
    console.log("[Backfill] No fields to update.");
    return;
  }

  const userRef = doc(db, "users", uid);
  await setDoc(userRef, patch, { merge: true });
  console.log(`[Backfill] users/${uid} updated with:`, patch);
}

(async () => {
  try {
    const args = getArgKV();
    const uid = args.UID || args.uid;
    const surveyId = args.SURVEY_ID || args.surveyId || args.survey_id;
    await backfill(uid, surveyId);
    process.exit(0);
  } catch (e) {
    console.error("[Backfill] Error:", e);
    process.exit(1);
  }
})();
