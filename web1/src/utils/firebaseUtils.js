// Firestore에서 필요한 함수 가져오기
import { collection, addDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Firestore 인스턴스 가져오기

// 사용자 데이터를 Firestore에 저장하는 함수
const saveUserData = async (data) => {
  try {
    const docRef = doc(db, 'users', data.name); // 사용자의 이름을 문서 ID로 사용
    await setDoc(docRef, data); // 데이터 저장
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};

export { saveUserData };

// 사용자별 answers를 저장하는 함수
export const saveUserAnswers = async (userName, answers) => {
  try {
    const userRef = doc(db, 'users', userName); // Firestore에서 사용자 문서 참조
    const snap = await getDoc(userRef);
    const existing = snap.exists() && snap.data().answers ? snap.data().answers : {};
    const merged = { ...existing, ...answers };
    await setDoc(userRef, { answers: merged }, { merge: true });
    console.log(`Answers saved for ${userName}`, merged);
  } catch (error) {
    console.error('Error saving answers:', error);
  }
};

// 사용자별 answers를 불러오는 함수
export const getUserAnswers = async (userName) => {
  try {
    const userRef = doc(db, 'users', userName);
    const snap = await getDoc(userRef);
    return snap.exists() ? snap.data().answers : {};
  } catch (e) {
    console.error("Error getting user answers: ", e);
    throw e;
  }
};

// 사용자의 설문 결과 점수를 저장하는 함수
export const saveSurveyScores = async (userName, scores) => {
  try {
    const userRef = doc(db, 'users', userName);
    const timestamp = new Date().toISOString();
    
    // 저장할 데이터 구조
    const scoreData = {
      timestamp,
      stdScores: scores.stdScores,
      meanScores: scores.meanScores,
      riskGroups: scores.riskGroups,
      overallMean: scores.overallMean,
      overallRiskGroup: scores.overallRiskGroup,
      overallFeedback: scores.overallFeedback,
      additionalFeedback: scores.additionalFeedback
    };

    // 기존 데이터 가져오기
    const snap = await getDoc(userRef);
    const existingData = snap.exists() ? snap.data() : {};
    
    // surveyResults 배열이 없으면 생성
    const surveyResults = existingData.surveyResults || [];
    
    // 새로운 결과 추가
    surveyResults.push(scoreData);
    
    // Firestore에 저장 (lastSurveyResult는 저장하지 않음)
    await setDoc(userRef, { 
      ...existingData,
      surveyResults, // 히스토리만 저장
      lastSurveyCompletedAt: timestamp // 마지막 설문 완료 시간
    }, { merge: true });

    console.log(`Survey scores, overall feedback, and completion time saved for ${userName}`, scoreData);
    return true;
  } catch (error) {
    console.error('Error saving survey scores:', error);
    throw error;
  }
};