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
  const [name, setName] = useState(''); // 이름 상태 추가
  const [gender, setGender] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [diagnosisDate, setDiagnosisDate] = useState('');
  const [cancerType, setCancerType] = useState('');
  const [otherCancerType, setOtherCancerType] = useState('');
  const [cancerStage, setCancerStage] = useState('');
  const [otherCancerDiagnosis, setOtherCancerDiagnosis] = useState('');
  const [otherCancerDetails, setOtherCancerDetails] = useState('');
  const [hasSurgery, setHasSurgery] = useState('');
  const [surgeryDate, setSurgeryDate] = useState('');
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

    // 진단 정보 검증
    if (!diagnosisDate) newErrors.diagnosisDate = '진단 시기를 입력해주세요.';
    if (!cancerType) newErrors.cancerType = '암 종류를 선택해주세요.';
    if (cancerType === '기타' && !otherCancerType) newErrors.otherCancerType = '기타 암 종류를 입력해주세요.';
    if (!cancerStage) newErrors.cancerStage = '암의 진행단계를 선택해주세요.';
    if (!otherCancerDiagnosis) newErrors.otherCancerDiagnosis = '초기 진단 받았던 암 이외에 다른 유형의 암 진단을 받으신 적이 있는지 선택해주세요.';
    if (otherCancerDiagnosis === '예' && !otherCancerDetails) newErrors.otherCancerDetails = '만약 진단 받은 적이 있다면, 어떤 암입니까?를 입력해주세요.';    // 치료 정보 검증
    if (!hasSurgery) newErrors.hasSurgery = '암 치료를 위한 수술을 받은 경험이 있는지 선택해주세요.';
    if (hasSurgery === '예' && !surgeryDate) newErrors.surgeryDate = '만약 수술 경험이 있다면, 그 날짜를 입력해주세요.';
    
    // 모든 경우에 치료 유형 검증
    if (treatmentTypes.length === 0) newErrors.treatmentTypes = '받은 치료 유형을 선택해주세요.';
    if (treatmentTypes.includes('기타') && !otherTreatmentType) newErrors.otherTreatmentType = '기타 치료명을 입력해주세요.';
    
    if (!hasRecurrence) newErrors.hasRecurrence = '암이 재발되거나 전이된 적이 있는지 선택해주세요.';

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
        newErrors.mentalHealthImpact = '위와 같은 정신과적 증상이 귀하의 일상생활에 얼마나 방해가 되었는지를 선택해주세요.';
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
      diagnosisDate,
      cancerType,
      otherCancerType,
      cancerStage,
      otherCancerDiagnosis,
      otherCancerDetails,
      hasSurgery,
      surgeryDate,
      treatmentTypes,
      hasRecurrence,
      mentalHealthHistory,
      mentalHealthDiagnoses,
      otherMentalDiagnosis,
      mentalHealthImpact,
      otherTreatmentType,
      info: {
        name,
        gender,
        diagnosisDate,
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
      <Paper elevation={4} sx={{ p: 5, mt: 5, backgroundColor: '#fafafa', borderRadius: 2 }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 700, color: '#0D47A1' }}>
          기본 스크리닝 질문
        </Typography>

        <Typography align="center" sx={{ mb: 4, color: 'gray' }}>
          아래의 항목들을 빠짐없이 입력해 주세요.
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          {/* Section: 개인정보 */}
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>🧍‍♂️ 개인정보</Typography>
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
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.gender}>
                <InputLabel>성별을 선택하세요</InputLabel>
                <Select value={gender} onChange={(e) => setGender(e.target.value)} label="성별">
                  <MenuItem value="남성">남성</MenuItem>
                  <MenuItem value="여성">여성</MenuItem>
                </Select>
                <FormHelperText>{errors.gender}</FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.maritalStatus}>
                <InputLabel>결혼 상태를 선택하세요</InputLabel>
                <Select value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)} label="결혼 상태">
                  <MenuItem value="미혼">미혼</MenuItem>
                  <MenuItem value="결혼">결혼</MenuItem>
                  <MenuItem value="기타">기타</MenuItem>
                </Select>
                <FormHelperText>{errors.maritalStatus}</FormHelperText>
              </FormControl>
            </Grid>
          </Grid>

          {/* Section: 진단 정보 */}
          <Typography variant="h6" sx={{ mt: 4, mb: 1, fontWeight: 'bold' }}>🩺 진단 정보</Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2} direction="column">
            <Grid item xs={12}>
              <TextField
                label="진단 시기"
                type="date"
                fullWidth
                value={diagnosisDate}
                onChange={(e) => setDiagnosisDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                error={!!errors.diagnosisDate}
                helperText={errors.diagnosisDate}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.cancerType}>
                <InputLabel>어떤 암으로 진단받았는지 선택하세요</InputLabel>
                <Select value={cancerType} onChange={(e) => setCancerType(e.target.value)} label="암 종류">
                  <MenuItem value="유방암">유방암</MenuItem>
                  <MenuItem value="폐암">폐암</MenuItem>
                  <MenuItem value="대장암">대장암</MenuItem>
                  <MenuItem value="기타">기타</MenuItem>
                </Select>
                <FormHelperText>{errors.cancerType}</FormHelperText>
              </FormControl>
            </Grid>
            {cancerType === '기타' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="기타 암 종류를 입력하세요"
                  placeholder="예: 췌장암"
                  value={otherCancerType}
                  onChange={(e) => setOtherCancerType(e.target.value)}
                  error={!!errors.otherCancerType}
                  helperText={errors.otherCancerType}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.cancerStage}>
                <InputLabel>처음 암 진단을 받으셨을 때 암의 진행단계는 몇 기였는지 선택하세요</InputLabel>
                <Select value={cancerStage} onChange={(e) => setCancerStage(e.target.value)} label="암의 진행단계">
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
              <FormControl fullWidth error={!!errors.otherCancerDiagnosis}>
                <InputLabel>초기 진단 받았던 암 이외에 다른 유형의 암 진단을 받으신 적이 있습니까?</InputLabel>
                <Select 
                  value={otherCancerDiagnosis} 
                  onChange={(e) => setOtherCancerDiagnosis(e.target.value)}
                  label="초기 진단 받았던 암 이외에 다른 유형의 암 진단을 받으신 적이 있습니까?"
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
                  label="만약 진단 받은 적이 있다면, 어떤 암입니까?"
                  placeholder="다른 유형의 암을 입력하세요"
                  value={otherCancerDetails}
                  onChange={(e) => setOtherCancerDetails(e.target.value)}
                  error={!!errors.otherCancerDetails}
                  helperText={errors.otherCancerDetails}
                />
              </Grid>
            )}
          </Grid>

          {/* Section: 치료 정보 */}
          <Typography variant="h6" sx={{ mt: 4, mb: 1, fontWeight: 'bold' }}>💊 치료 정보</Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2} direction="column">
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.hasSurgery}>
                <InputLabel>암 치료를 위한 수술을 받은 경험이 있습니까?</InputLabel>
                <Select 
                  value={hasSurgery} 
                  onChange={(e) => setHasSurgery(e.target.value)}
                  label="암 치료를 위한 수술을 받은 경험이 있습니까?"
                >
                  <MenuItem value="예">예</MenuItem>
                  <MenuItem value="아니오">아니오</MenuItem>
                </Select>
                <FormHelperText>{errors.hasSurgery}</FormHelperText>
              </FormControl>
            </Grid>
            {hasSurgery === '예' && (
              <Grid item xs={12}>
                <TextField
                  label="만약 수술 경험이 있다면, 그 날짜는 언제입니까?"
                  type="date"
                  fullWidth
                  value={surgeryDate}
                  onChange={(e) => setSurgeryDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.surgeryDate}
                  helperText={errors.surgeryDate}
                />
              </Grid>
            )}
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" color="#003366" gutterBottom>
              받은 치료 유형 (해당하는 모든 항목 선택)
            </Typography>
            { /* 치료 유형 체크박스 */} 
            <FormGroup>
  {treatmentOptions.map((treatment) => (
    <FormControlLabel
      key={treatment}
      control={
        <Checkbox
          checked={treatmentTypes.includes(treatment)}
          onChange={handleTreatmentChange}
          value={treatment}
          sx={{ transform: 'scale(1.2)' }}
        />
      }
      label={treatment}
      componentsProps={{
        typography: {
          variant: 'subtitle2',
          color: 'text.secondary'
        }
      }}
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
                sx={{ mt: 1, mb: 3 }}
                error={!!errors.otherTreatmentType}
                helperText={errors.otherTreatmentType}
              />
            )}
          </Box>

          <Grid container spacing={2} direction="column" sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.hasRecurrence}>
                <InputLabel>암이 재발되거나 전이된 적이 있습니까?</InputLabel>
                <Select 
                  value={hasRecurrence} 
                  onChange={(e) => setHasRecurrence(e.target.value)} 
                  label="암이 재발되거나 전이된 적이 있습니까?"
                >
                  <MenuItem value="예">예</MenuItem>
                  <MenuItem value="아니오">아니오</MenuItem>
                </Select>
                <FormHelperText>{errors.hasRecurrence}</FormHelperText>
              </FormControl>
            </Grid>
          </Grid>

          {/* Section: 정신 건강 정보 */}
          <Typography variant="h6" sx={{ mt: 4, mb: 1, fontWeight: 'bold' }}>🧠 정신 건강 정보</Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2} direction="column">
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.mentalHealthHistory}>
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
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
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
                    />
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <FormControl fullWidth error={!!errors.mentalHealthImpact}>
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
                  '&:hover': { backgroundColor: '#E3F2FD' }
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
                  '&:hover': { backgroundColor: '#1565C0' }
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