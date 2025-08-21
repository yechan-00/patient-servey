// src/components/Section7Component.js
// Section7: 추가 섹션 (절주, 금연) 질문

import React, { useEffect } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import { saveUserAnswers } from '../utils/firebaseUtils';  // Firestore 저장 함수 import

// props에 name 추가
const Section7Component = ({ name, answers, setAnswers }) => {
  // answers 변경 시마다 Firestore에 저장
  useEffect(() => {
    console.log('Section7Component useEffect – name:', name, 'answers:', answers);
    if (!name) {
      console.log('useEffect aborted – no name provided');
      return;
    }
    saveUserAnswers(name, answers)
      .then(() => console.log(`Saved Section7 answers for ${name}`))
      .catch(err => console.error('Error saving Section7 answers:', err));
  }, [answers, name]);

  const questions = [
    { id: 'q32', label: '암 발병 이후, 절주 하고 있다.' },
    { id: 'q33', label: '암 발병 이후, 금연 하고 있다.' }
  ];

  const options = [
    { value: '1', label: '전혀 그렇지 않다' },
    { value: '2', label: '약간 그렇지 않다' },
    { value: '3', label: '보통이다' },
    { value: '4', label: '약간 그렇다' },
    { value: '5', label: '매우 그렇다' }
  ];

  const handleChange = (e) => {
    const { name: questionId, value } = e.target;
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  return (
    <Box>
      {questions.map((q) => (
        <FormControl component="fieldset" key={q.id} sx={{ mb: 2 }} fullWidth>
          <FormLabel
            component="legend"
            sx={{ fontWeight: 'bold', color: 'primary.main' }}
          >
            {q.label}
          </FormLabel>
          <RadioGroup
            name={q.id}
            value={answers[q.id] || ''}
            onChange={handleChange}
          >
            {options.map((opt) => (
              <FormControlLabel
                key={opt.value}
                value={opt.value}
                control={<Radio color="primary" />}
                label={opt.label}
              />
            ))}
          </RadioGroup>
        </FormControl>
      ))}
    </Box>
  );
};

export default Section7Component;
