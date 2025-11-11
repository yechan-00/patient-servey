// src/pages/patient-detail/PatientCounseling.jsx
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  doc,
} from "firebase/firestore";
import { db } from "../../firebase";

/** ===================== Styles ===================== */
const Card = styled.div`
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 1.25rem;
  margin-bottom: 1.25rem;
`;

const CardTitle = styled.h3`
  font-size: 1.05rem;
  margin: 0 0 1rem;
  color: #343a40;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 0.5rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem 1rem;
  color: #6c757d;
`;

const Button = styled.button`
  background-color: ${(p) => (p.secondary ? "#6c757d" : "#2a5e8c")};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 0.9rem;
  font-size: 0.9rem;
  cursor: pointer;

  &:hover {
    background-color: ${(p) => (p.secondary ? "#5a6268" : "#1d4269")};
  }
`;

const SmallButton = styled(Button)`
  padding: 0.35rem 0.65rem;
  font-size: 0.85rem;
  border-radius: 4px;
`;

const NoteForm = styled.form`
  margin-top: 0.5rem;
  display: grid;
  gap: 0.5rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  resize: vertical;
  min-height: 90px;
`;

const CounselingRequestsList = styled.div`
  margin-top: 0.5rem;
`;

const CounselingRequestItem = styled.div`
  padding: 0.85rem 0;
  border-bottom: 1px solid #e9ecef;

  &:last-child {
    border-bottom: none;
  }
`;

const CounselingRequestHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CounselingRequestTitle = styled.h4`
  margin: 0;
  font-size: 1rem;
`;

const Badge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
  background-color: ${(p) => {
    if (p.status === "pending") return "#ffc107";
    if (p.status === "accepted") return "#28a745";
    if (p.status === "completed") return "#6c757d";
    if (p.type === "high") return "#dc3545";
    if (p.type === "medium") return "#ffc107";
    return "#28a745";
  }};
`;

const CounselingRequestMeta = styled.div`
  display: flex;
  justify-content: space-between;
  color: #6c757d;
  font-size: 0.85rem;
  margin-top: 0.35rem;
`;

const NotesList = styled.div`
  margin-top: 0.5rem;
`;

const NoteItem = styled.div`
  padding: 0.8rem 0;
  border-bottom: 1px solid #e9ecef;
  &:last-child {
    border-bottom: none;
  }
`;

const NoteHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const NoteInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const NoteDate = styled.span`
  color: #6c757d;
  font-size: 0.85rem;
`;

const NoteActions = styled.div`
  display: flex;
  gap: 0.35rem;
`;

const NoteContent = styled.p`
  margin: 0.45rem 0 0;
  white-space: pre-line;
`;

const NoteEditTextArea = styled.textarea`
  width: 100%;
  padding: 0.65rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  resize: vertical;
  min-height: 90px;
  margin-top: 0.5rem;
`;

const EditButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 0.4rem;
`;

/** ===================== Helpers ===================== */
const fmtDate = (dLike) => {
  if (!dLike) return "—";
  try {
    const d =
      typeof dLike?.toDate === "function"
        ? dLike.toDate()
        : dLike instanceof Date
        ? dLike
        : new Date(dLike);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  } catch {
    return "—";
  }
};

const getRequestStatusText = (status) => {
  const statuses = {
    pending: "대기 중",
    accepted: "예약 확정",
    completed: "완료",
    cancelled: "취소됨",
  };
  return statuses[status] || "알 수 없음";
};

/** ===================== Component ===================== */
function PatientCounseling({ patientId }) {
  const navigate = useNavigate();

  const [reqLoading, setReqLoading] = useState(true);
  const [notesLoading, setNotesLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [editNoteId, setEditNoteId] = useState(null);
  const [editNoteContent, setEditNoteContent] = useState("");

  // counselingRequests 가져오기
  useEffect(() => {
    let alive = true;
    const fetchRequests = async () => {
      setReqLoading(true);
      try {
        const ref = collection(db, "counselingRequests");
        const q = query(ref, where("userId", "==", patientId));
        const snap = await getDocs(q);
        const rows = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          rows.push({
            id: docSnap.id,
            ...data,
            createdAt: data?.createdAt?.toDate
              ? data.createdAt.toDate()
              : data?.createdAt || null,
          });
        });
        // 최신순 정렬
        rows.sort(
          (a, b) =>
            (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0)
        );
        if (alive) setRequests(rows);
      } catch (e) {
        console.error("counselingRequests 로드 실패:", e);
        if (alive) setRequests([]);
      } finally {
        if (alive) setReqLoading(false);
      }
    };
    if (patientId) fetchRequests();
    return () => {
      alive = false;
    };
  }, [patientId]);

  // notes 가져오기
  useEffect(() => {
    let alive = true;
    const fetchNotes = async () => {
      setNotesLoading(true);
      try {
        const notesRef = collection(db, "patients", patientId, "notes");
        // 단일 orderBy는 보조 인덱스 없이 사용 가능
        const q = query(notesRef, orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const rows = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          rows.push({
            id: docSnap.id,
            ...data,
            createdAt: data?.createdAt?.toDate
              ? data.createdAt.toDate()
              : data?.createdAt || new Date(),
          });
        });
        if (alive) setNotes(rows);
      } catch (e) {
        console.error("notes 로드 실패:", e);
        if (alive) setNotes([]);
      } finally {
        if (alive) setNotesLoading(false);
      }
    };
    if (patientId) fetchNotes();
    return () => {
      alive = false;
    };
  }, [patientId]);

  // 노트 추가
  const handleAddNote = async (e) => {
    e.preventDefault();
    const content = newNote.trim();
    if (!content) return;
    try {
      const noteData = {
        content,
        authorId: "관리자",
        createdAt: serverTimestamp(),
      };
      const ref = await addDoc(
        collection(db, "patients", patientId, "notes"),
        noteData
      );
      // 낙관적 업데이트
      setNotes((prev) => [
        {
          id: ref.id,
          ...noteData,
          createdAt: new Date(),
        },
        ...prev,
      ]);
      setNewNote("");
    } catch (e) {
      console.error(e);
      alert("상담 노트 추가 중 오류가 발생했습니다.");
    }
  };

  // 노트 수정 모드
  const handleEditMode = (note) => {
    setEditNoteId(note.id);
    setEditNoteContent(note.content || "");
  };

  const handleCancelEdit = () => {
    setEditNoteId(null);
    setEditNoteContent("");
  };

  const handleUpdateNote = async (noteId) => {
    const content = editNoteContent.trim();
    if (!content) return;
    try {
      const noteRef = doc(db, "patients", patientId, "notes", noteId);
      await updateDoc(noteRef, {
        content,
        updatedAt: serverTimestamp(),
      });
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId ? { ...n, content, updatedAt: new Date() } : n
        )
      );
      setEditNoteId(null);
      setEditNoteContent("");
    } catch (e) {
      console.error(e);
      alert("상담 노트 수정 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (
      !window.confirm(
        "이 상담 노트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      )
    ) {
      return;
    }
    try {
      const noteRef = doc(db, "patients", patientId, "notes", noteId);
      await deleteDoc(noteRef);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (e) {
      console.error(e);
      alert("상담 노트 삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <>
      {/* 최근 상담 요청 */}
      <Card>
        <CardTitle>최근 상담 요청</CardTitle>
        {reqLoading ? (
          <EmptyState>상담 요청을 불러오는 중...</EmptyState>
        ) : requests.length === 0 ? (
          <EmptyState>아직 상담 요청이 없습니다.</EmptyState>
        ) : (
          <CounselingRequestsList>
            {requests.slice(0, 5).map((req) => (
              <CounselingRequestItem key={req.id}>
                <CounselingRequestHeader>
                  <CounselingRequestTitle>
                    상담 요청 #{req.id.substring(0, 8)}
                  </CounselingRequestTitle>
                  <Badge status={req.status}>
                    {getRequestStatusText(req.status)}
                  </Badge>
                </CounselingRequestHeader>
                {req.concerns && <p style={{ margin: "6px 0 0" }}>{req.concerns}</p>}
                <CounselingRequestMeta>
                  <span>요청일: {fmtDate(req.createdAt)}</span>
                  <SmallButton onClick={() => navigate(`/counseling-record/${req.id}`)}>
                    상세보기
                  </SmallButton>
                </CounselingRequestMeta>
              </CounselingRequestItem>
            ))}
          </CounselingRequestsList>
        )}
      </Card>

      {/* 상담 노트 작성 */}
      <Card>
        <CardTitle>상담 노트 작성</CardTitle>
        <NoteForm onSubmit={handleAddNote}>
          <TextArea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="환자와의 상담 내용, 관찰 사항, 후속 조치 등을 기록하세요..."
          />
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button type="submit">노트 저장</Button>
          </div>
        </NoteForm>
      </Card>

      {/* 상담 노트 기록 */}
      <Card>
        <CardTitle>상담 노트 기록</CardTitle>
        {notesLoading ? (
          <EmptyState>상담 노트를 불러오는 중...</EmptyState>
        ) : notes.length === 0 ? (
          <EmptyState>아직 상담 노트가 없습니다.</EmptyState>
        ) : (
          <NotesList>
            {notes.map((note) => (
              <NoteItem key={note.id}>
                <NoteHeader>
                  <NoteInfo>
                    <NoteDate>{fmtDate(note.createdAt)}</NoteDate>
                  </NoteInfo>
                  {editNoteId !== note.id && (
                    <NoteActions>
                      <SmallButton onClick={() => handleEditMode(note)}>
                        수정
                      </SmallButton>
                      <SmallButton
                        secondary
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        삭제
                      </SmallButton>
                    </NoteActions>
                  )}
                </NoteHeader>

                {editNoteId === note.id ? (
                  <>
                    <NoteEditTextArea
                      value={editNoteContent}
                      onChange={(e) => setEditNoteContent(e.target.value)}
                    />
                    <EditButtonGroup>
                      <SmallButton secondary onClick={handleCancelEdit}>
                        취소
                      </SmallButton>
                      <SmallButton onClick={() => handleUpdateNote(note.id)}>
                        저장
                      </SmallButton>
                    </EditButtonGroup>
                  </>
                ) : (
                  <NoteContent>{note.content}</NoteContent>
                )}
              </NoteItem>
            ))}
          </NotesList>
        )}
      </Card>
    </>
  );
}

export default PatientCounseling;
