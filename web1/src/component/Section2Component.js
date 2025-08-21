import React, { useEffect } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  Typography
} from '@mui/material';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import { useNavigate } from 'react-router-dom';
import { saveUserAnswers } from '../utils/firebaseUtils';

const Section2Component = ({ name, answers, setAnswers, setValidationError, validationError }) => {
  const navigate = useNavigate();

  // Firestore에 저장
  useEffect(() => {
    if (!name) return;
    saveUserAnswers(name, answers).catch(console.error);
  }, [answers, name]);

  const questions = [
    { id: 'q9',  label: '9. 여러 가지 식품군을 골고루 섭취한다 (예: 균형식).' },
    { id: 'q10', label: '10. 암 진단 및 치료 이후, 규칙적인 운동을 하고 있다.' },
    { id: 'q11', label: '11. 규칙적인 식사를 한다.' },
    { id: 'q12', label: '12. 나는 내가 생각한 건강관리 방법을 잘 실천하고 있다.' },
    { id: 'q13', label: '13. 암 진단 및 치료 이후, 식이조절을 한다.' }
  ];

  const reasons12_1 = [
    '1) 무엇을 해야 할지 몰라서',
    '2) 건강관리 자체를 스트레스라고 생각해서',
    '3) 의지가 없어서',
    '4) 시간이 많이 걸려서',
    '5) 가족이 도와주지 않아서',
    '6) 경제적으로 부담이 되어서',
    '7) 기타'
  ];

  const sub13 = [
    { id: 'q13_1_1', num: '1)', text: '조미료 섭취를 줄인다.' },
    { id: 'q13_1_2', num: '2)', text: '식품의 신선도를 중요시한다.' },
    { id: 'q13_1_3', num: '3)', text: '채식 및 과일 위주의 식습관을 한다.' },
    { id: 'q13_1_4', num: '4)', text: '육류 섭취를 조절한다.' },
    { id: 'q13_1_5', num: '5)', text: '탄수화물 섭취를 조절한다.' },
    { id: 'q13_1_6', num: '6)', text: '항암식품(예: 버섯, 도라지, 두유, 현미식 등)을 먹는다.' }
  ];

  const options = [
    { value: '1', label: '전혀 그렇지 않다' },
    { value: '2', label: '약간 그렇지 않다' },
    { value: '3', label: '보통이다' },
    { value: '4', label: '약간 그렇다' },
    { value: '5', label: '매우 그렇다' }
  ];

  const handleRadio = (e) => {
    const { name: qId, value } = e.target;

    // q12 문항에서 3, 4, 5를 선택하면 섹션5로 바로 이동 (필수 체크 먼저!)
    if (qId === 'q12' && ['3', '4', '5'].includes(value)) {
      const updated = { ...answers, [qId]: value };
      // 9,10,11 필수 체크 (updated는 방금 값 반영됨)
      if (
        !updated.q9 || (typeof updated.q9 === 'string' && updated.q9.trim() === '') ||
        !updated.q10 || (typeof updated.q10 === 'string' && updated.q10.trim() === '') ||
        !updated.q11 || (typeof updated.q11 === 'string' && updated.q11.trim() === '')
      ) {
        setValidationError(true);   // 경고창 띄우기
        setAnswers(updated);        // 답변 반영만
        return;                     // 이동 막기
      }
      setAnswers(updated);
      localStorage.setItem('surveyAnswers', JSON.stringify(updated));
      navigate('/section5', { state: { name, fromSkip: true } });
      return;
    }

    // 그 외 문항 처리
    setAnswers((prev) => {
      const updated = { ...prev, [qId]: value };
      if (qId === 'q12' && !['1', '2'].includes(value)) {
        delete updated.q12_reasons;
      }
      return updated;
    });
    setValidationError(false);
  };

  const handleReasons = (e) => {
    const { value } = e.target;
    const prev = answers.q12_reasons || [];
    const next = prev.includes(value)
      ? prev.filter((v) => v !== value)
      : [...prev, value];
    setAnswers((prevAns) => ({ ...prevAns, q12_reasons: next }));
  };

  const validateSection2 = () => {
    const required = ['q9', 'q10', 'q11', 'q12'];
    const missing = required.filter((id) => !answers[id]);
    if (answers.q12 === '1' || answers.q12 === '2') {
      if (!answers.q12_reasons || answers.q12_reasons.length === 0) {
        missing.push('q12_reasons');
      }
    }
    setValidationError(missing.length > 0);
    return missing.length === 0;
  };

  return (
    <Box sx={{ backgroundColor: 'background.paper', p: 3, borderRadius: 2, boxShadow: 1 }}>
      {questions.slice(0, 4).map((q) => (
        <FormControl component="fieldset" key={q.id} sx={{ mb: 2 }} fullWidth>
          <FormLabel component="legend" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            {q.label}
          </FormLabel>
          {/* 12번 문항에만 안내 문구 추가 */}
          {q.id === 'q12' && (
            <>
              <Box sx={{ background: '#f5f7fa', borderRadius: 2, p: 2, mb: 1, borderLeft: '4px solid #1976d2', display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '1rem' }}>
                  <Box component="span" sx={{ fontSize: '1.2em', mr: 1 }}>※</Box>
                  <Box component="span" sx={{ color: '#1976d2', fontWeight: 700, fontSize: '1.05em', mr: 1 }}>안내</Box>
                  <Box component="span" sx={{ color: '#333' }}>
                    <span role="img" aria-label="down">👇</span> <b>1번, 2번</b>을 선택하신 경우, 아래 이유 중 해당되는 항목을 모두 선택해 주세요.<br/>
                    <span role="img" aria-label="fast-forward">⏩</span> <b>3번, 4번, 5번</b>을 선택하신 경우, <Box component="span" sx={{ color: '#1976d2', fontWeight: 600, display: 'inline' }}>26번(생활습관) 문항</Box>으로 자동 이동합니다.
                  </Box>
                </Typography>
              </Box>
              {setValidationError && typeof validationError !== 'undefined' && validationError && (
                <Box sx={{ background: '#fff3e0', borderRadius: 2, p: 1.5, mb: 1, borderLeft: '4px solid #ff9800' }}>
                  <Typography variant="body2" sx={{ color: '#d84315', fontWeight: 600 }}>
                    이전 질문(9, 10, 11번)을 모두 완료해 주세요.
                  </Typography>
                </Box>
              )}
            </>
          )}
          <RadioGroup
            name={q.id}
            value={answers[q.id] || ''}
            onChange={handleRadio}
          >
            {options.map((opt) => (
              <FormControlLabel
                key={opt.value}
                value={opt.value}
                control={<Radio />}
                label={opt.label}
              />
            ))}
          </RadioGroup>
        </FormControl>
      ))}

      {/* Q12-1: q12가 1 또는 2일 때만 표시 */}
      {['1', '2'].includes(answers.q12) && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
            ※ 12-1. 해당되지 않는 이유를 모두 선택하세요.
          </Typography>
          <FormGroup>
            {reasons12_1.map((reason, idx) => (
              <FormControlLabel
                key={idx}
                control={
                  <Radio
                    checked={answers.q12_reasons?.includes(reason) || false}
                    onChange={handleReasons}
                    name="q12_reasons"
                    value={reason}
                    icon={<RadioButtonUncheckedIcon />}
                    checkedIcon={<RadioButtonCheckedIcon />}
                  />
                }
                label={reason}
              />
            ))}
          </FormGroup>
        </Box>
      )}

      {/* Q13 */}
      <FormControl component="fieldset" sx={{ mb: 2 }} fullWidth>
        <FormLabel component="legend" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          {questions[4].label}
        </FormLabel>
        <RadioGroup
          name="q13"
          value={answers.q13 || ''}
          onChange={handleRadio}
        >
          {options.map((opt) => (
            <FormControlLabel
              key={opt.value}
              value={opt.value}
              control={<Radio />}
              label={opt.label}
            />
          ))}
        </RadioGroup>
      </FormControl>

      {/* Q13-1: q13가 4 또는 5일 때만 표시 */}
      {['4', '5'].includes(answers.q13) && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
            ※ 13-1. 아래 각각의 사항에 대해서 식이조절을 얼마나 잘 하는지 체크해 주세요.
          </Typography>
          {sub13.map((item) => (
            <FormControl component="fieldset" key={item.id} sx={{ mb: 2 }} fullWidth>
              <FormLabel component="legend">
                <Typography component="span" sx={{ fontWeight: 'bold', mr: 1 }}>
                  {item.num}
                </Typography>
                <Typography component="span">{item.text}</Typography>
              </FormLabel>
              <RadioGroup
                name={item.id}
                value={answers[item.id] || ''}
                onChange={handleRadio}
              >
                {options.map((opt) => (
                  <FormControlLabel
                    key={opt.value}
                    value={opt.value}
                    control={<Radio />}
                    label={opt.label}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default Section2Component;
