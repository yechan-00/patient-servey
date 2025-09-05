// src/component/SurveyForm.js
import React, { useState } from 'react';
import {
  Container, Typography, TextField, MenuItem, FormControl, InputLabel,
  Select, Button, Grid, Checkbox, FormGroup, FormControlLabel, Box, Paper, Divider,
  Radio, RadioGroup, FormHelperText
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { saveUserData } from '../utils/firebaseUtils';

const SurveyForm = () => {
  const navigate = useNavigate();
  
  const [birthDate, setBirthDate] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  
  // 개인정보 필드들
  const [familyComposition, setFamilyComposition] = useState([]);
  const [caregiver, setCaregiver] = useState('');
  const [healthConsultant, setHealthConsultant] = useState('');
  const [workStatus, setWorkStatus] = useState('');
  const [workType, setWorkType] = useState('');
  
  const [diagnosisYear, setDiagnosisYear] = useState('');
  const [diagnosisMonth, setDiagnosisMonth] = useState('');
  const [cancerType, setCancerType] = useState('');
  const [cancerStage, setCancerStage] = useState('');
  const [otherCancerDiagnosis, setOtherCancerDiagnosis] = useState('');
  const [otherCancerDetails, setOtherCancerDetails] = useState('');
  const [hasSurgery, setHasSurgery] = useState('');
  const [surgeryYear, setSurgeryYear] = useState('');
  const [surgeryMonth, setSurgeryMonth] = useState('');
  
  // 추가 스크리닝 질문들
  const [alcoholReduction, setAlcoholReduction] = useState('');
  const [smokingCessation, setSmokingCessation] = useState('');
  const [pastAlcoholAmount, setPastAlcoholAmount] = useState('');
  const [currentAlcoholAmount, setCurrentAlcoholAmount] = useState('');
  const [pastSmokingAmount, setPastSmokingAmount] = useState('');
  const [currentSmokingAmount, setCurrentSmokingAmount] = useState('');
  const [alcoholReductionBarriers, setAlcoholReductionBarriers] = useState([]);
  const [smokingCessationBarriers, setSmokingCessationBarriers] = useState([]);
  const [treatmentTypes, setTreatmentTypes] = useState([]);
  const [hasRecurrence, setHasRecurrence] = useState('');
  const [mentalHealthHistory, setMentalHealthHistory] = useState('');
  const [mentalHealthDiagnoses, setMentalHealthDiagnoses] = useState({
    depression: false,
    anxietyDisorder: false,
    schizophrenia: false,
    other: false
  });
  const [otherMentalDiagnosis, setOtherMentalDiagnosis] = useState('');
  const [mentalHealthImpact, setMentalHealthImpact] = useState('');
  const [otherTreatmentType, setOtherTreatmentType] = useState('');
  const [errors, setErrors] = useState({});
  
  // 가족 구성 옵션
  const familyOptions = [
    '배우자',
    '자녀',
    '부모',
    '형제/자매',
    '기타 가족',
    '친구/지인',
    '혼자 거주'
  ];

  // 근로 상태 옵션
  const workStatusOptions = [
    '정규직',
    '비정규직',
    '자영업',
    '학생',
    '주부',
    '은퇴',
    '휴직/병가',
    '무직',
    '기타'
  ];
  
  const treatmentOptions = [
    '방사선치료',
    '항암화학치료',
    '호르몬치료',
    '표적치료',
    '면역치료',
    '기타',
    '없음'
  ];

  const handleTreatmentChange = (event) => {
    const { value } = event.target;
    setTreatmentTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
  };

  const handleFamilyCompositionChange = (event) => {
    const { value } = event.target;
    setFamilyComposition((prev) =>
      prev.includes(value) ? prev.filter((f) => f !== value) : [...prev, value]
    );
  };

  const handleMentalHealthDiagnosisChange = (diagnosis) => (event) => {
    setMentalHealthDiagnoses(prev => ({
      ...prev,
      [diagnosis]: event.target.checked
    }));
  };

  const validate = () => {
    const newErrors = {};

    // 개인정보 검증
    if (!name) newErrors.name = '이름을 입력해주세요.';
    if (!birthDate) newErrors.birthDate = '생년월일을 입력해주세요.';
    if (!gender) newErrors.gender = '성별을 선택해주세요.';
    if (!maritalStatus) newErrors.maritalStatus = '결혼 상태를 선택해주세요.';
    if (familyComposition.length === 0) newErrors.familyComposition = '가족 구성을 선택해주세요.';
    if (!caregiver) newErrors.caregiver = '주 돌봄 제공자를 입력해주세요.';
    if (!healthConsultant) newErrors.healthConsultant = '건강 관리 상담 대상을 입력해주세요.';
    if (!workStatus) newErrors.workStatus = '근로 상태를 선택해주세요.';

    // 진단 정보 검증 (필수가 아님 - 대략적인 정보도 허용)
    if (!cancerType) newErrors.cancerType = '암 종류를 입력해주세요.';
    if (!cancerStage) newErrors.cancerStage = '암의 진행단계를 선택해주세요.';
    if (!otherCancerDiagnosis) newErrors.otherCancerDiagnosis = '다른 유형의 암 진단 여부를 선택해주세요.';
    if (otherCancerDiagnosis === '예' && !otherCancerDetails) newErrors.otherCancerDetails = '다른 진단받은 암의 종류를 입력해주세요.';
    
    // 치료 정보 검증
    if (!hasSurgery) newErrors.hasSurgery = '수술 경험 여부를 선택해주세요.';
    if (treatmentTypes.length === 0) newErrors.treatmentTypes = '받은 치료 유형을 선택해주세요.';
    if (treatmentTypes.includes('기타') && !otherTreatmentType) newErrors.otherTreatmentType = '기타 치료명을 입력해주세요.';
    
    if (!hasRecurrence) newErrors.hasRecurrence = '재발/전이 여부를 선택해주세요.';

    // 정신 건강 정보 검증
    if (!mentalHealthHistory) newErrors.mentalHealthHistory = '정신과적 진단을 받은 경험이 있는지 선택해주세요.';
    if (mentalHealthHistory === '예') {
      if (Object.values(mentalHealthDiagnoses).every(value => !value)) {
        newErrors.mentalHealthDiagnoses = '받은 정신과적 진단을 선택해주세요.';
      }
      if (mentalHealthDiagnoses.other && !otherMentalDiagnosis) {
        newErrors.otherMentalDiagnosis = '기타 정신질환명을 입력해주세요.';
      }
      if (!mentalHealthImpact) {
        newErrors.mentalHealthImpact = '정신과적 증상이 일상생활에 미친 영향을 선택해주세요.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    // 사용자 데이터 객체 생성
    const userData = {
      name,
      birthDate,
      gender,
      maritalStatus,
      familyComposition,
      caregiver,
      healthConsultant,
      workStatus,
      workType,
      diagnosisYear,
      diagnosisMonth,
      cancerType,
      cancerStage,
      otherCancerDiagnosis,
      otherCancerDetails,
      hasSurgery,
      surgeryYear,
      surgeryMonth,
      treatmentTypes,
      hasRecurrence,
      mentalHealthHistory,
      mentalHealthDiagnoses,
      otherMentalDiagnosis,
      mentalHealthImpact,
      otherTreatmentType,
      // 추가 스크리닝 질문들
      alcoholReduction,
      smokingCessation,
      pastAlcoholAmount,
      currentAlcoholAmount,
      pastSmokingAmount,
      currentSmokingAmount,
      alcoholReductionBarriers,
      smokingCessationBarriers,
      info: {
        name,
        gender,
        diagnosisYear: diagnosisYear + '년 ' + diagnosisMonth + '월',
        cancerType,
      },
      answers: {}
    };

    // Firebase에 데이터 저장
    await saveUserData(userData);
    
    // 다음 섹션으로 이동
    navigate('/section1', { state: { userName: userData.name } });
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={4} sx={{ p: { xs: 3, sm: 5 }, mt: 5, backgroundColor: '#fafafa', borderRadius: 2 }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 700, color: '#0D47A1', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          기본 스크리닝 질문
        </Typography>

        <Typography align="center" sx={{ mb: 4, color: 'gray', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
          아래의 항목들을 빠짐없이 입력해 주세요.
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          {/* Section: 개인정보 */}
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>🧑‍🦲 개인정보</Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2} direction="column">
            <Grid item xs={12}>
              <TextField
                label="이름"
                placeholder="이름을 입력하세요"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                sx={{ minHeight: '72px' }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="생년월일"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                error={!!errors.birthDate}
                helperText={errors.birthDate}
                sx={{ minHeight: '72px' }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.gender} sx={{ minHeight: '72px' }}>
                <InputLabel>성별</InputLabel>
                <Select value={gender} onChange={(e) => setGender(e.target.value)} label="성별">
                  <MenuItem value="남성">남성</MenuItem>
                  <MenuItem value="여성">여성</MenuItem>
                </Select>
                <FormHelperText>{errors.gender}</FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.maritalStatus} sx={{ minHeight: '72px' }}>
                <InputLabel>결혼 상태</InputLabel>
                <Select value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)} label="결혼 상태">
                  <MenuItem value="미혼">미혼</MenuItem>
                  <MenuItem value="기혼">기혼</MenuItem>
                  <MenuItem value="이혼">이혼</MenuItem>
                  <MenuItem value="사별">사별</MenuItem>
                  <MenuItem value="기타">기타</MenuItem>
                </Select>
                <FormHelperText>{errors.maritalStatus}</FormHelperText>
              </FormControl>
            </Grid>
            
            {/* 가족 구성 */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                가족 구성/동거인 (해당하는 모든 항목 선택)
              </Typography>
              <FormGroup>
                {familyOptions.map((option) => (
                  <FormControlLabel
                    key={option}
                    control={
                      <Checkbox
                        checked={familyComposition.includes(option)}
                        onChange={handleFamilyCompositionChange}
                        value={option}
                        size="small"
                      />
                    }
                    label={option}
                    sx={{ my: 0.2 }}
                  />
                ))}
              </FormGroup>
              {errors.familyComposition && (
                <FormHelperText error>{errors.familyComposition}</FormHelperText>
              )}
            </Grid>

            {/* 주 돌봄 제공자 */}
            <Grid item xs={12}>
              <TextField
                label="주 돌봄 제공자"
                placeholder="예: 배우자, 자녀, 간병인, 본인 등"
                fullWidth
                value={caregiver}
                onChange={(e) => setCaregiver(e.target.value)}
                error={!!errors.caregiver}
                helperText={errors.caregiver}
                sx={{ minHeight: '72px' }}
              />
            </Grid>

            {/* 건강 관리 상담 대상 */}
            <Grid item xs={12}>
              <TextField
                label="건강 관리에 대해 상의할 수 있는 사람"
                placeholder="예: 주치의, 간호사, 가족, 친구 등"
                fullWidth
                value={healthConsultant}
                onChange={(e) => setHealthConsultant(e.target.value)}
                error={!!errors.healthConsultant}
                helperText={errors.healthConsultant}
                sx={{ minHeight: '72px' }}
              />
            </Grid>

            {/* 근로 상태 */}
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.workStatus} sx={{ minHeight: '72px' }}>
                <InputLabel>근로 상태</InputLabel>
                <Select value={workStatus} onChange={(e) => setWorkStatus(e.target.value)} label="근로 상태">
                  {workStatusOptions.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
                <FormHelperText>{errors.workStatus}</FormHelperText>
              </FormControl>
            </Grid>

            {/* 근로 형태 */}
            <Grid item xs={12}>
              <TextField
                label="근로 형태 (선택사항)"
                placeholder="예: 사무직, 서비스업, 제조업 등"
                fullWidth
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
                sx={{ minHeight: '72px' }}
              />
            </Grid>
          </Grid>

          {/* Section: 진단 정보 */}
          <Typography variant="h6" sx={{ mt: 4, mb: 1, fontWeight: 'bold', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>🩺 진단 정보</Typography>
          <Divider sx={{ mb: 2 }} />

          <Box sx={{ mb: 2, p: 2, backgroundColor: '#e3f2fd', borderRadius: 1, borderLeft: '4px solid #1976d2' }}>
            <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 500 }}>
              💡 <strong>안내:</strong> 정확한 날짜를 기억하지 못하셔도 괜찮습니다. 대략적인 시기를 선택해 주세요.
            </Typography>
          </Box>

          <Grid container spacing={2} direction="column">
            {/* 진단 시기 - 년도/월 선택 */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                현재 진단받은 주요 암의 진단 시기 (대략적인 시기도 괜찮습니다)
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth error={!!errors.diagnosisYear} sx={{ minHeight: '72px' }}>
                    <InputLabel>년도</InputLabel>
                    <Select 
                      value={diagnosisYear} 
                      onChange={(e) => setDiagnosisYear(e.target.value)} 
                      label="년도"
                    >
                      {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <MenuItem key={year} value={year}>{year}년</MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>{errors.diagnosisYear}</FormHelperText>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth error={!!errors.diagnosisMonth} sx={{ minHeight: '72px' }}>
                    <InputLabel>월</InputLabel>
                    <Select 
                      value={diagnosisMonth} 
                      onChange={(e) => setDiagnosisMonth(e.target.value)} 
                      label="월"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <MenuItem key={month} value={month}>{month}월</MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>{errors.diagnosisMonth}</FormHelperText>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>
            
            {/* 암 종류 - 주관식 입력 */}
            <Grid item xs={12}>
              <TextField
                label="현재 진단받은 주요 암은 무엇인가요?"
                placeholder="예: 유방암, 폐암, 대장암, 위암, 간암 등 (여러 개의 암이 있는 경우 모두 기재)"
                fullWidth
                multiline
                rows={2}
                value={cancerType}
                onChange={(e) => setCancerType(e.target.value)}
                error={!!errors.cancerType}
                helperText={errors.cancerType || "여러 개의 암이 있는 경우 모두 기재해 주세요."}
                sx={{ minHeight: '100px' }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.cancerStage} sx={{ minHeight: '72px' }}>
                <InputLabel>현재 주요 암의 진행단계</InputLabel>
                <Select value={cancerStage} onChange={(e) => setCancerStage(e.target.value)} label="현재 주요 암의 진행단계">
                  <MenuItem value="0기">0기</MenuItem>
                  <MenuItem value="1기">1기</MenuItem>
                  <MenuItem value="2기">2기</MenuItem>
                  <MenuItem value="3기">3기</MenuItem>
                  <MenuItem value="4기">4기</MenuItem>
                  <MenuItem value="모름">잘 모르겠다</MenuItem>
                </Select>
                <FormHelperText>{errors.cancerStage}</FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.otherCancerDiagnosis} sx={{ minHeight: '72px' }}>
                <InputLabel>위에서 작성한 암 외에 다른 유형의 암 진단을 받은 적이 있나요?</InputLabel>
                <Select 
                  value={otherCancerDiagnosis} 
                  onChange={(e) => setOtherCancerDiagnosis(e.target.value)}
                  label="위에서 작성한 암 외에 다른 유형의 암 진단을 받은 적이 있나요?"
                >
                  <MenuItem value="예">예</MenuItem>
                  <MenuItem value="아니오">아니오</MenuItem>
                </Select>
                <FormHelperText>{errors.otherCancerDiagnosis}</FormHelperText>
              </FormControl>
            </Grid>
            {otherCancerDiagnosis === '예' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="다른 진단받은 암의 종류"
                  placeholder="다른 유형의 암을 모두 입력해주세요"
                  value={otherCancerDetails}
                  onChange={(e) => setOtherCancerDetails(e.target.value)}
                  error={!!errors.otherCancerDetails}
                  helperText={errors.otherCancerDetails}
                  sx={{ minHeight: '72px' }}
                />
              </Grid>
            )}
          </Grid>

          {/* Section: 치료 정보 */}
          <Typography variant="h6" sx={{ mt: 4, mb: 1, fontWeight: 'bold', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>💊 치료 정보</Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2} direction="column">
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.hasSurgery} sx={{ minHeight: '72px' }}>
                <InputLabel>수술 경험 여부</InputLabel>
                <Select 
                  value={hasSurgery} 
                  onChange={(e) => setHasSurgery(e.target.value)}
                  label="수술 경험 여부"
                >
                  <MenuItem value="예">예</MenuItem>
                  <MenuItem value="아니오">아니오</MenuItem>
                </Select>
                <FormHelperText>{errors.hasSurgery}</FormHelperText>
              </FormControl>
            </Grid>
            {hasSurgery === '예' && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                  수술 시기 (가장 최근 수술일 기준, 대략적인 시기도 괜찮습니다)
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <FormControl fullWidth error={!!errors.surgeryYear} sx={{ minHeight: '72px' }}>
                      <InputLabel>년도</InputLabel>
                      <Select 
                        value={surgeryYear} 
                        onChange={(e) => setSurgeryYear(e.target.value)} 
                        label="년도"
                      >
                        {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
                          <MenuItem key={year} value={year}>{year}년</MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>{errors.surgeryYear}</FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth error={!!errors.surgeryMonth} sx={{ minHeight: '72px' }}>
                      <InputLabel>월</InputLabel>
                      <Select 
                        value={surgeryMonth} 
                        onChange={(e) => setSurgeryMonth(e.target.value)} 
                        label="월"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                          <MenuItem key={month} value={month}>{month}월</MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>{errors.surgeryMonth}</FormHelperText>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>
            )}
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" color="#003366" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}>
              받은 치료 유형 (해당하는 모든 항목 선택)
            </Typography>
            <FormGroup>
              {treatmentOptions.map((treatment) => (
                <FormControlLabel
                  key={treatment}
                  control={
                    <Checkbox
                      checked={treatmentTypes.includes(treatment)}
                      onChange={handleTreatmentChange}
                      value={treatment}
                      size="small"
                    />
                  }
                  label={treatment}
                  sx={{ my: 0.2 }}
                />
              ))}
            </FormGroup>

            {errors.treatmentTypes && (
              <FormHelperText error>{errors.treatmentTypes}</FormHelperText>
            )}

            {/* 기타 항목 */}
            {treatmentTypes.includes('기타') && (
              <TextField
                fullWidth
                label="기타 치료 유형을 입력하세요"
                placeholder="예: 고강도 초음파 치료"
                value={otherTreatmentType}
                onChange={(e) => setOtherTreatmentType(e.target.value)}
                sx={{ mt: 1, mb: 3, minHeight: '72px' }}
                error={!!errors.otherTreatmentType}
                helperText={errors.otherTreatmentType}
              />
            )}
          </Box>

          <Grid container spacing={2} direction="column" sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.hasRecurrence} sx={{ minHeight: '72px' }}>
                <InputLabel>재발/전이 여부</InputLabel>
                <Select 
                  value={hasRecurrence} 
                  onChange={(e) => setHasRecurrence(e.target.value)} 
                  label="재발/전이 여부"
                >
                  <MenuItem value="예">예</MenuItem>
                  <MenuItem value="아니오">아니오</MenuItem>
                </Select>
                <FormHelperText>{errors.hasRecurrence}</FormHelperText>
              </FormControl>
            </Grid>
          </Grid>

          {/* Section: 정신 건강 정보 */}
          <Typography variant="h6" sx={{ mt: 4, mb: 1, fontWeight: 'bold', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>🧠 정신 건강 정보</Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2} direction="column">
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.mentalHealthHistory} sx={{ minHeight: '72px' }}>
                <InputLabel>정신과적 진단을 받은 경험이 있습니까?</InputLabel>
                <Select 
                  value={mentalHealthHistory} 
                  onChange={(e) => setMentalHealthHistory(e.target.value)}
                  label="정신과적 진단을 받은 경험이 있습니까?"
                >
                  <MenuItem value="예">예</MenuItem>
                  <MenuItem value="아니오">아니오</MenuItem>
                </Select>
                <FormHelperText>{errors.mentalHealthHistory}</FormHelperText>
              </FormControl>
            </Grid>
            
            {mentalHealthHistory === '예' && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                    받은 정신과적 진단 (해당하는 모든 항목 선택)
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={mentalHealthDiagnoses.depression}
                          onChange={handleMentalHealthDiagnosisChange('depression')}
                          sx={{ transform: 'scale(1.2)' }}
                        />
                      }
                      label="우울증"
                      componentsProps={{
                        typography: {
                          variant: 'subtitle2',
                          color: 'text.secondary'
                        }
                      }}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={mentalHealthDiagnoses.anxietyDisorder}
                          onChange={handleMentalHealthDiagnosisChange('anxietyDisorder')}
                          sx={{ transform: 'scale(1.2)' }}
                        />
                      }
                      label="불안장애"
                      componentsProps={{
                        typography: {
                          variant: 'subtitle2',
                          color: 'text.secondary'
                        }
                      }}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={mentalHealthDiagnoses.schizophrenia}
                          onChange={handleMentalHealthDiagnosisChange('schizophrenia')}
                          sx={{ transform: 'scale(1.2)' }}
                        />
                      }
                      label="조현병"
                      componentsProps={{
                        typography: {
                          variant: 'subtitle2',
                          color: 'text.secondary'
                        }
                      }}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={mentalHealthDiagnoses.other}
                          onChange={handleMentalHealthDiagnosisChange('other')}
                          sx={{ transform: 'scale(1.2)' }}
                        />
                      }
                      label="기타 정신질환"
                      componentsProps={{
                        typography: {
                          variant: 'subtitle2',
                          color: 'text.secondary'
                        }
                      }}
                    />
                  </FormGroup>
                  {errors.mentalHealthDiagnoses && (
                    <FormHelperText error>{errors.mentalHealthDiagnoses}</FormHelperText>
                  )}
                </Grid>
                
                {mentalHealthDiagnoses.other && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="기타 정신질환 진단명"
                      placeholder="진단명을 입력하세요"
                      value={otherMentalDiagnosis}
                      onChange={(e) => setOtherMentalDiagnosis(e.target.value)}
                      error={!!errors.otherMentalDiagnosis}
                      helperText={errors.otherMentalDiagnosis}
                      sx={{ minHeight: '72px' }}
                    />
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <FormControl fullWidth error={!!errors.mentalHealthImpact} sx={{ minHeight: '72px' }}>
                    <InputLabel>위와 같은 정신과적 증상이 귀하의 일상생활에 얼마나 방해가 되었습니까?</InputLabel>
                    <Select
                      value={mentalHealthImpact}
                      onChange={(e) => setMentalHealthImpact(e.target.value)}
                      label="위와 같은 정신과적 증상이 귀하의 일상생활에 얼마나 방해가 되었습니까?"
                    >
                      <MenuItem value="전혀 아님">전혀 아님</MenuItem>
                      <MenuItem value="거의 아님">거의 아님</MenuItem>
                      <MenuItem value="보통">보통</MenuItem>
                      <MenuItem value="종종">종종</MenuItem>
                      <MenuItem value="자주">자주</MenuItem>
                    </Select>
                    <FormHelperText>{errors.mentalHealthImpact}</FormHelperText>
                  </FormControl>
                </Grid>
              </>
            )}
          </Grid>

          {/* Section: 건강행동 정보 (절주/금연) */}
          <Typography variant="h6" sx={{ mt: 4, mb: 1, fontWeight: 'bold', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>🚭🍷 건강행동 정보</Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2} direction="column">
            {/* 절주 관련 질문 */}
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ minHeight: '72px' }}>
                <InputLabel>절주를 시도한 경험이 있으신가요?</InputLabel>
                <Select
                  value={alcoholReduction}
                  onChange={(e) => setAlcoholReduction(e.target.value)}
                  label="절주를 시도한 경험이 있으신가요?"
                >
                  <MenuItem value="예">예</MenuItem>
                  <MenuItem value="아니오">아니오</MenuItem>
                  <MenuItem value="해당없음">해당없음 (음주를 하지 않음)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {alcoholReduction === '예' && (
              <>
                <Grid item xs={12}>
                  <TextField
                    label="과거 음주량 (주당)"
                    placeholder="예: 소주 2병, 맥주 6캔 등"
                    fullWidth
                    value={pastAlcoholAmount}
                    onChange={(e) => setPastAlcoholAmount(e.target.value)}
                    sx={{ minHeight: '72px' }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="현재 음주량 (주당)"
                    placeholder="예: 소주 1병, 맥주 3캔 등"
                    fullWidth
                    value={currentAlcoholAmount}
                    onChange={(e) => setCurrentAlcoholAmount(e.target.value)}
                    sx={{ minHeight: '72px' }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                    절주 실패 이유 (해당하는 모든 항목 선택)
                  </Typography>
                  <FormGroup>
                    {['스트레스', '사교 모임', '습관', '의지력 부족', '환경적 요인', '기타'].map((reason) => (
                      <FormControlLabel
                        key={reason}
                        control={
                          <Checkbox
                            checked={alcoholReductionBarriers.includes(reason)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAlcoholReductionBarriers(prev => [...prev, reason]);
                              } else {
                                setAlcoholReductionBarriers(prev => prev.filter(r => r !== reason));
                              }
                            }}
                            size="small"
                          />
                        }
                        label={reason}
                        sx={{ my: 0.2 }}
                      />
                    ))}
                  </FormGroup>
                </Grid>
              </>
            )}

            {/* 금연 관련 질문 */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <FormControl fullWidth sx={{ minHeight: '72px' }}>
                <InputLabel>금연을 시도한 경험이 있으신가요?</InputLabel>
                <Select
                  value={smokingCessation}
                  onChange={(e) => setSmokingCessation(e.target.value)}
                  label="금연을 시도한 경험이 있으신가요?"
                >
                  <MenuItem value="예">예</MenuItem>
                  <MenuItem value="아니오">아니오</MenuItem>
                  <MenuItem value="해당없음">해당없음 (흡연을 하지 않음)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {smokingCessation === '예' && (
              <>
                <Grid item xs={12}>
                  <TextField
                    label="과거 흡연량 (일일)"
                    placeholder="예: 하루 1갑, 하루 10개비 등"
                    fullWidth
                    value={pastSmokingAmount}
                    onChange={(e) => setPastSmokingAmount(e.target.value)}
                    sx={{ minHeight: '72px' }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="현재 흡연량 (일일)"
                    placeholder="예: 하루 반갑, 하루 5개비 등"
                    fullWidth
                    value={currentSmokingAmount}
                    onChange={(e) => setCurrentSmokingAmount(e.target.value)}
                    sx={{ minHeight: '72px' }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                    금연 실패 이유 (해당하는 모든 항목 선택)
                  </Typography>
                  <FormGroup>
                    {['스트레스', '습관', '금단증상', '의지력 부족', '환경적 요인', '기타'].map((reason) => (
                      <FormControlLabel
                        key={reason}
                        control={
                          <Checkbox
                            checked={smokingCessationBarriers.includes(reason)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSmokingCessationBarriers(prev => [...prev, reason]);
                              } else {
                                setSmokingCessationBarriers(prev => prev.filter(r => r !== reason));
                              }
                            }}
                            size="small"
                          />
                        }
                        label={reason}
                        sx={{ my: 0.2 }}
                      />
                    ))}
                  </FormGroup>
                </Grid>
              </>
            )}
          </Grid>

          {/* 버튼 */}
          <Grid container spacing={2} mt={4}>
            <Grid item xs={6}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/')}
                sx={{
                  fontWeight: 'bold',
                  color: '#1976D2',
                  borderColor: '#1976D2',
                  '&:hover': { backgroundColor: '#E3F2FD' },
                  minHeight: '48px'
                }}
              >
                이전
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{
                  fontWeight: 'bold',
                  backgroundColor: '#1976D2',
                  color: '#fff',
                  '&:hover': { backgroundColor: '#1565C0' },
                  minHeight: '48px'
                }}
              >
                다음
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default SurveyForm;
