// src/components/Section3Component.js
// Section3: 회복하도록 도와주는 사람들 질문 (Q14~Q17 및 Q15-1 하위 문항)

import React, { useEffect } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup
} from '@mui/material';
import { saveUserAnswers } from '../utils/firebaseUtils';

const Section3Component = ({ name, answers, setAnswers, missingQuestions = [] }) => {
  // answers 변경 시마다 Firestore에 저장
  useEffect(() => {
    console.log('Section3Component useEffect – name:', name, 'answers:', answers);
    if (!name) {
      console.log('useEffect aborted – no name provided');
      return;
    }
    saveUserAnswers(name, answers)
      .then(() => console.log(`Saved Section3 answers for ${name}`))
      .catch(err => console.error('Error saving Section3 answers:', err));
  }, [answers, name]);

  // Q14~Q17 라디오 질문 (문구 수정)
  const questions = [
    { id: 'q14', label: '14. 주변인들은 나에게 실질적인 도움을 주고 있다.' },
    { id: 'q15', label: '15. 주변인들은 나에게 충분한 관심과 사랑을 주고 있다.' },
    { id: 'q16', label: '16. 내 성격이 암을 견뎌내는데 도움이 되고 있다.' },
    { id: 'q17', label: '17. 내 친구들은 나에게 충분한 관심과 위로를 주고 있다.' }
  ];

  // Q15-1 라디오 이유 옵션 (문구 수정)
  const reasons15 = [
    '주변인들의 도움에 대한 기대감이 낮아서',
    '현실적으로 챙겨줄 수 있는 사람이 없어서',
    '주변인들이 바빠서',
    '주변인들의 무심한 성격 때문에',
    '나를 환자로 대하지 않아서',
    '기타'
  ];

  // 공통 옵션
  const options = [
    { value: '1', label: '전혀 그렇지 않다' },
    { value: '2', label: '약간 그렇지 않다' },
    { value: '3', label: '보통이다' },
    { value: '4', label: '약간 그렇다' },
    { value: '5', label: '매우 그렇다' }
  ];

  // 라디오 변경 핸들러
  const handleRadio = (e) => {
    const { name: questionId, value } = e.target;
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleReasons15 = (e) => {
    const { value } = e.target;
    const prev = answers.q15_reasons || [];
    const next = prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value];
    setAnswers(prev => ({ ...prev, q15_reasons: next }));
  };

  return (
    <Box sx={{ backgroundColor: 'background.paper', p: 3, borderRadius: 2, boxShadow: 1 }}>
      {/* Q14 */}
      <FormControl 
        component="fieldset" 
        sx={{ 
          mb: 2,
          ...(missingQuestions.includes('q14') && {
            border: '2px solid #f44336',
            borderRadius: 1,
            p: 2,
            backgroundColor: '#ffebee'
          })
        }} 
        fullWidth
        id="q14"
      >
        <FormLabel 
          component="legend" 
          sx={{ 
            fontWeight: 'bold', 
            color: missingQuestions.includes('q14') ? 'error.main' : 'primary.main' 
          }}
        >
          {questions[0].label}
          {missingQuestions.includes('q14') && (
            <Box component="span" sx={{ color: 'error.main', fontWeight: 'bold', ml: 1 }}>
              ※ 필수 응답
            </Box>
          )}
        </FormLabel>
        <RadioGroup name={questions[0].id} value={answers[questions[0].id] || ''} onChange={handleRadio}>
          {options.map(opt => (
            <FormControlLabel
              key={opt.value}
              value={opt.value}
              control={<Radio />}
              label={opt.label}
            />
          ))}
        </RadioGroup>
      </FormControl>

      {/* Q15 */}
      <FormControl 
        component="fieldset" 
        sx={{ 
          mb: 2,
          ...(missingQuestions.includes('q15') && {
            border: '2px solid #f44336',
            borderRadius: 1,
            p: 2,
            backgroundColor: '#ffebee'
          })
        }} 
        fullWidth
        id="q15"
      >
        <FormLabel 
          component="legend" 
          sx={{ 
            fontWeight: 'bold', 
            color: missingQuestions.includes('q15') ? 'error.main' : 'primary.main' 
          }}
        >
          {questions[1].label}
          {missingQuestions.includes('q15') && (
            <Box component="span" sx={{ color: 'error.main', fontWeight: 'bold', ml: 1 }}>
              ※ 필수 응답
            </Box>
          )}
        </FormLabel>
        <RadioGroup name={questions[1].id} value={answers[questions[1].id] || ''} onChange={handleRadio}>
          {options.map(opt => (
            <FormControlLabel
              key={opt.value}
              value={opt.value}
              control={<Radio />}
              label={opt.label}
            />
          ))}
        </RadioGroup>
      </FormControl>

      {/* Q15-1: Q15에서 1,2번 선택 시 바로 아래에 표시 */}
      {(answers.q15 === '1' || answers.q15 === '2') && (
        <FormControl component="fieldset" sx={{ mb: 2 }} fullWidth>
          <FormLabel component="legend" sx={{ fontWeight: 'bold', display: 'block', mb: 1, color: 'text.primary' }}>
            ※ 15-1. 귀하께서 주변인들로부터 관심과 도움을 받지 못하는 이유 (해당되는 것 모두 체크)
          </FormLabel>
          <FormGroup>
            {reasons15.map((reason, idx) => (
              <FormControlLabel
                key={idx}
                control={
                  <Checkbox
                    checked={(answers.q15_reasons || []).includes(reason)}
                    onChange={handleReasons15}
                    value={reason}
                  />
                }
                label={reason}
              />
            ))}
          </FormGroup>
        </FormControl>
      )}

      {/* Q16 */}
      <FormControl 
        component="fieldset" 
        sx={{ 
          mb: 2,
          ...(missingQuestions.includes('q16') && {
            border: '2px solid #f44336',
            borderRadius: 1,
            p: 2,
            backgroundColor: '#ffebee'
          })
        }} 
        fullWidth
        id="q16"
      >
        <FormLabel 
          component="legend" 
          sx={{ 
            fontWeight: 'bold', 
            color: missingQuestions.includes('q16') ? 'error.main' : 'primary.main' 
          }}
        >
          {questions[2].label}
          {missingQuestions.includes('q16') && (
            <Box component="span" sx={{ color: 'error.main', fontWeight: 'bold', ml: 1 }}>
              ※ 필수 응답
            </Box>
          )}
        </FormLabel>
        <RadioGroup name={questions[2].id} value={answers[questions[2].id] || ''} onChange={handleRadio}>
          {options.map(opt => (
            <FormControlLabel
              key={opt.value}
              value={opt.value}
              control={<Radio />}
              label={opt.label}
            />
          ))}
        </RadioGroup>
      </FormControl>

      {/* Q17 */}
      <FormControl 
        component="fieldset" 
        sx={{ 
          mb: 2,
          ...(missingQuestions.includes('q17') && {
            border: '2px solid #f44336',
            borderRadius: 1,
            p: 2,
            backgroundColor: '#ffebee'
          })
        }} 
        fullWidth
        id="q17"
      >
        <FormLabel 
          component="legend" 
          sx={{ 
            fontWeight: 'bold', 
            color: missingQuestions.includes('q17') ? 'error.main' : 'primary.main' 
          }}
        >
          {questions[3].label}
          {missingQuestions.includes('q17') && (
            <Box component="span" sx={{ color: 'error.main', fontWeight: 'bold', ml: 1 }}>
              ※ 필수 응답
            </Box>
          )}
        </FormLabel>
        <RadioGroup name={questions[3].id} value={answers[questions[3].id] || ''} onChange={handleRadio}>
          {options.map(opt => (
            <FormControlLabel
              key={opt.value}
              value={opt.value}
              control={<Radio />}
              label={opt.label}
            />
          ))}
        </RadioGroup>
      </FormControl>
    </Box>
  );
}

export default Section3Component;
