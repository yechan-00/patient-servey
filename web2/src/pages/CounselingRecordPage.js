// src/pages/CounselingRecordPage.js
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Layout from '../components/Layout';
import { 
  doc, getDoc, updateDoc, collection, 
  addDoc, getDocs, query, orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

// 컨테이너
const Container = styled.div`
  margin-bottom: 2rem;
`;

// 뒤로가기 링크
const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  font-size: 0.9rem;
  color: #6c757d;
  text-decoration: none;
  margin-bottom: 1rem;
  
  &:hover {
    color: #495057;
  }
`;

// 2열 그리드
const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  
  @media (max-width: 992px) {
    grid-template-columns: 1fr;
  }
`;

// 카드
const Card = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

// 카드 제목
const CardTitle = styled.h3`
  font-size: 1.1rem;
  margin: 0 0 1.5rem;
  color: #343a40;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 0.75rem;
`;

// 요청 헤더
const RequestHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

// 환자 정보
const PatientInfo = styled.div`
  display: flex;
  align-items: center;
`;

// 환자 이니셜 아바타
const PatientAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #2a5e8c;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: bold;
  margin-right: 1rem;
`;

// 환자 이름
const PatientName = styled.h2`
  font-size: 1.2rem;
  margin: 0 0 0.25rem;
`;

// 배지
const Badge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 700;
  background-color: ${props => {
    if (props.status === 'pending') return '#ffc107';
    if (props.status === 'accepted') return '#28a745';
    if (props.status === 'completed') return '#6c757d';
    return '#dc3545';
  }};
  color: white;
`;

// 정보 그룹
const InfoGroup = styled.div`
  margin-bottom: 1rem;
`;

// 정보 라벨
const InfoLabel = styled.p`
  font-size: 0.8rem;
  color: #6c757d;
  margin: 0 0 0.25rem;
`;

// 정보 값
const InfoValue = styled.p`
  margin: 0;
  font-weight: 500;
`;

// 요청 내용
const RequestContent = styled.div`
  white-space: pre-line;
  margin-bottom: 1.5rem;
`;

// 버튼
const Button = styled.button`
  background-color: ${props => props.secondary ? '#6c757d' : '#2a5e8c'};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: ${props => props.secondary ? '#5a6268' : '#1d4269'};
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

// 버튼 그룹
const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
`;

// 텍스트 영역
const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  resize: vertical;
  min-height: 150px;
  margin-bottom: 1rem;
`;

// a일력 필드
const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
`;

// 폼 그룹
const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

// 라벨
const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
`;

// 에러 메시지
const ErrorMessage = styled.p`
  color: #dc3545;
  font-size: 0.9rem;
  margin-top: 0.5rem;
`;

// 노트 목록
const NotesList = styled.div`
  margin-top: 1.5rem;
`;

// 노트 아이템
const NoteItem = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
  
  &:last-child {
    border-bottom: none;
  }
`;

// 노트 헤더
const NoteHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

// 노트 작성자
const NoteAuthor = styled.span`
  font-weight: 500;
`;

// 노트 날짜
const NoteDate = styled.span`
  color: #6c757d;
  font-size: 0.8rem;
`;

// 노트 내용
const NoteContent = styled.p`
  margin: 0;
  white-space: pre-line;
`;

// 빈 상태 메시지
const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6c757d;
`;

// 상태 스텝
const StatusSteps = styled.div`
  display: flex;
  margin-bottom: 2rem;
`;

// 스텝
const Step = styled.div`
  flex: 1;
  text-align: center;
  position: relative;
  
  &:not(:last-child)::after {
    content: '';
    position: absolute;
    top: 2rem;
    right: 0;
    width: 100%;
    height: 2px;
    background-color: ${props => props.active ? '#2a5e8c' : '#e9ecef'};
    z-index: 1;
  }
`;

// 스텝 아이콘
const StepIcon = styled.div`
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background-color: ${props => props.active ? '#2a5e8c' : '#e9ecef'};
  color: ${props => props.active ? 'white' : '#6c757d'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin: 0 auto 0.5rem;
  z-index: 2;
  position: relative;
`;

// 스텝 라벨
const StepLabel = styled.div`
  font-size: 0.9rem;
  color: ${props => props.active ? '#343a40' : '#6c757d'};
  font-weight: ${props => props.active ? '500' : '400'};
`;

// 상태를 한글로 변환
const getStatusText = (status) => {
  const statuses = {
    'pending': '대기 중',
    'accepted': '예약 확정',
    'completed': '완료',
    'cancelled': '취소됨'
  };
  return statuses[status] || '알 수 없음';
};

// 연락 방법을 한글로 변환
const getContactMethodText = (method) => {
  const methods = {
    'phone': '전화',
    'sms': '문자메시지',
    'kakaotalk': '카카오톡',
    'email': '이메일'
  };
  return methods[method] || '알 수 없음';
};

// 연락 가능 시간을 한글로 변환
const getContactTimeText = (time) => {
  const times = {
    'anytime': '언제든지 가능',
    'morning': '오전 (9시-12시)',
    'afternoon': '오후 (12시-18시)',
    'evening': '저녁 (18시-21시)'
  };
  return times[time] || '알 수 없음';
};

function CounselingRecordPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { currentUser, socialWorkerData } = useAuth();
  
  const [request, setRequest] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [validationError, setValidationError] = useState('');
  
  // 상담 요청 및 관련 데이터 불러오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 상담 요청 불러오기
        const requestDoc = await getDoc(doc(db, "counselingRequests", requestId));
        
        if (!requestDoc.exists()) {
          setError("상담 요청을 찾을 수 없습니다.");
          setLoading(false);
          return;
        }
        
        const requestData = {
          id: requestDoc.id,
          ...requestDoc.data(),
          createdAt: requestDoc.data().createdAt?.toDate() || new Date()
        };
        
        setRequest(requestData);
        
        // 환자 정보 불러오기
        if (requestData.userId) {
          const patientDoc = await getDoc(doc(db, "patients", requestData.userId));
          
          if (patientDoc.exists()) {
            setPatient({
              id: patientDoc.id,
              ...patientDoc.data()
            });
          }
        }
        
        // 상담 노트 불러오기
        const notesQuery = query(
          collection(db, "counselingRequests", requestId, "notes"),
          orderBy("createdAt", "desc")
        );
        
        const notesSnapshot = await getDocs(notesQuery);
        const notesData = [];
        
        notesSnapshot.forEach(doc => {
          notesData.push({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
          });
        });
        
        setNotes(notesData);
        
        // 이미 예약된 일정 정보 설정
        if (requestData.appointmentDate) {
          setAppointmentDate(requestData.appointmentDate);
        }
        
        if (requestData.appointmentTime) {
          setAppointmentTime(requestData.appointmentTime);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("데이터 불러오기 오류:", error);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
        setLoading(false);
      }
    };
    
    fetchData();
  }, [requestId]);
  
  // 상담 요청 상태 업데이트
  const handleStatusUpdate = async (status) => {
    try {
      const updates = {
        status,
        updatedAt: serverTimestamp()
      };
      
      // 상태가 accepted인 경우 상담 일정 정보 추가
      if (status === 'accepted') {
        if (!appointmentDate || !appointmentTime) {
          setValidationError("상담 일정을 입력해 주세요.");
          return;
        }
        
        updates.appointmentDate = appointmentDate;
        updates.appointmentTime = appointmentTime;
      }
      
      await updateDoc(doc(db, "counselingRequests", requestId), updates);
      
      // 로컬 상태 업데이트
      setRequest(prev => ({
        ...prev,
        ...updates,
        updatedAt: new Date()
      }));
      
      setValidationError('');
    } catch (error) {
      console.error("상태 업데이트 오류:", error);
      setError("상태 업데이트 중 오류가 발생했습니다.");
    }
  };
  
  // 상담 노트 추가
  const handleAddNote = async (e) => {
    e.preventDefault();
    
    if (!newNote.trim()) {
      setValidationError("노트 내용을 입력해 주세요.");
      return;
    }
    
    try {
      const noteData = {
        content: newNote,
        authorId: currentUser.uid,
        authorName: socialWorkerData?.name || "사회복지사",
        createdAt: serverTimestamp()
      };
      
      const noteRef = await addDoc(
        collection(db, "counselingRequests", requestId, "notes"),
        noteData
      );
      
      const newNoteWithId = {
        id: noteRef.id,
        ...noteData,
        createdAt: new Date()
      };
      
      setNotes(prev => [newNoteWithId, ...prev]);
      setNewNote('');
      setValidationError('');
    } catch (error) {
      console.error("노트 추가 오류:", error);
      setValidationError("노트 추가 중 오류가 발생했습니다.");
    }
  };
  
  // 환자 상세 페이지로 이동
  const goToPatientDetail = () => {
    if (patient?.id) {
      navigate(`/patients/${patient.id}`);
    }
  };
  
  // 환자 이니셜 가져오기
  const getPatientInitials = () => {
    if (!request?.name) return '?';
    
    const nameParts = request.name.split(' ');
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    
    return request.name[0].toUpperCase();
  };
  
  // 현재 상태에 따른 스텝 인덱스 가져오기
  const getActiveStepIndex = () => {
    switch (request?.status) {
      case 'pending': return 0;
      case 'accepted': return 1;
      case 'completed': return 2;
      case 'cancelled': return 3;
      default: return 0;
    }
  };
  
  if (loading) {
    return (
      <Layout title="상담 기록">
        <Container>
          <p>데이터를 불러오는 중...</p>
        </Container>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout title="상담 기록">
        <Container>
          <BackLink to="/counseling-requests">← 상담 요청 목록으로</BackLink>
          <Card>
            <p>{error}</p>
          </Card>
        </Container>
      </Layout>
    );
  }
  
  if (!request) {
    return (
      <Layout title="상담 기록">
        <Container>
          <BackLink to="/counseling-requests">← 상담 요청 목록으로</BackLink>
          <Card>
            <p>상담 요청 정보를 찾을 수 없습니다.</p>
          </Card>
        </Container>
      </Layout>
    );
  }
  
  const activeStepIndex = getActiveStepIndex();
  
  return (
    <Layout title="상담 기록">
      <Container>
        <BackLink to="/counseling-requests">← 상담 요청 목록으로</BackLink>
        
        <Card>
          <RequestHeader>
            <PatientInfo>
              <PatientAvatar>{getPatientInitials()}</PatientAvatar>
              <div>
                <PatientName>{request.name || '익명'}</PatientName>
                <p>요청일: {request.createdAt.toLocaleDateString()}</p>
              </div>
            </PatientInfo>
            <Badge status={request.status}>
              {getStatusText(request.status)}
            </Badge>
          </RequestHeader>
          
          <StatusSteps>
            <Step active={activeStepIndex >= 0}>
              <StepIcon active={activeStepIndex >= 0}>1</StepIcon>
              <StepLabel active={activeStepIndex >= 0}>요청 접수</StepLabel>
            </Step>
            <Step active={activeStepIndex >= 1}>
              <StepIcon active={activeStepIndex >= 1}>2</StepIcon>
              <StepLabel active={activeStepIndex >= 1}>상담 예약</StepLabel>
            </Step>
            <Step active={activeStepIndex >= 2}>
              <StepIcon active={activeStepIndex >= 2}>3</StepIcon>
              <StepLabel active={activeStepIndex >= 2}>상담 완료</StepLabel>
            </Step>
          </StatusSteps>
          
          <TwoColumnGrid>
            <div>
              <CardTitle>요청 정보</CardTitle>
              
              <InfoGroup>
                <InfoLabel>연락처</InfoLabel>
                <InfoValue>{request.phone || '정보 없음'}</InfoValue>
              </InfoGroup>
              
              <InfoGroup>
                <InfoLabel>연락 방법</InfoLabel>
                <InfoValue>{getContactMethodText(request.contactMethod)}</InfoValue>
              </InfoGroup>
              
              <InfoGroup>
                <InfoLabel>연락 가능 시간</InfoLabel>
                <InfoValue>{getContactTimeText(request.contactTime)}</InfoValue>
              </InfoGroup>
              
              <InfoGroup>
                <InfoLabel>희망 상담 날짜</InfoLabel>
                <InfoValue>{request.preferredDate || '정보 없음'}</InfoValue>
              </InfoGroup>
              
              <InfoGroup>
                <InfoLabel>희망 상담 시간</InfoLabel>
                <InfoValue>{request.preferredTime || '정보 없음'}</InfoValue>
              </InfoGroup>
              
              {request.status === 'accepted' && (
                <>
                  <CardTitle>예약된 상담</CardTitle>
                  <InfoGroup>
                    <InfoLabel>상담 날짜</InfoLabel>
                    <InfoValue>{request.appointmentDate || '정보 없음'}</InfoValue>
                  </InfoGroup>
                  <InfoGroup>
                    <InfoLabel>상담 시간</InfoLabel>
                    <InfoValue>{request.appointmentTime || '정보 없음'}</InfoValue>
                  </InfoGroup>
                </>
              )}
              
              <CardTitle>상담 희망 사항</CardTitle>
              <RequestContent>
                {request.concerns || '상담 희망 사항이 없습니다.'}
              </RequestContent>
              
              <RequestContent>
                {request.additionalInfo && (
                  <>
                    <InfoLabel>추가 정보</InfoLabel>
                    <p>{request.additionalInfo}</p>
                  </>
                )}
              </RequestContent>
              
              {patient && (
                <Button onClick={goToPatientDetail}>
                  환자 상세 정보 보기
                </Button>
              )}
            </div>
            
            <div>
              {request.status === 'pending' && (
                <Card>
                  <CardTitle>상담 일정 등록</CardTitle>
                  
                  <FormGroup>
                    <Label htmlFor="appointmentDate">상담 날짜</Label>
                    <Input
                      type="date"
                      id="appointmentDate"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <Label htmlFor="appointmentTime">상담 시간</Label>
                    <Input
                      type="time"
                      id="appointmentTime"
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                    />
                  </FormGroup>
                  
                  {validationError && (
                    <ErrorMessage>{validationError}</ErrorMessage>
                  )}
                  
                  <ButtonGroup>
                    <Button onClick={() => handleStatusUpdate('accepted')}>
                      상담 확정
                    </Button>
                    <Button 
                      secondary 
                      onClick={() => handleStatusUpdate('cancelled')}
                    >
                      요청 거절
                    </Button>
                  </ButtonGroup>
                </Card>
              )}
              
              {request.status === 'accepted' && (
                <Card>
                  <CardTitle>상담 진행</CardTitle>
                  <Button onClick={() => handleStatusUpdate('completed')}>
                    상담 완료 처리
                  </Button>
                </Card>
              )}
              
              <Card>
                <CardTitle>상담 노트</CardTitle>
                
                <form onSubmit={handleAddNote}>
                  <TextArea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="상담 내용, 후속 조치 등을 기록하세요..."
                  />
                  
                  <Button type="submit">
                    노트 저장
                  </Button>
                </form>
                
                {notes.length === 0 ? (
                  <EmptyState>
                    <p>등록된 상담 노트가 없습니다.</p>
                  </EmptyState>
                ) : (
                  <NotesList>
                    {notes.map(note => (
                      <NoteItem key={note.id}>
                        <NoteHeader>
                          <NoteAuthor>{note.authorName}</NoteAuthor>
                          <NoteDate>{note.createdAt.toLocaleString()}</NoteDate>
                        </NoteHeader>
                        <NoteContent>{note.content}</NoteContent>
                      </NoteItem>
                    ))}
                  </NotesList>
                )}
              </Card>
            </div>
          </TwoColumnGrid>
        </Card>
      </Container>
    </Layout>
  );
}

export default CounselingRecordPage;