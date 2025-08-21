// src/components/Section1Component.js
import React, { useEffect } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import { saveUserAnswers } from '../utils/firebaseUtils';

const Section1Component = ({ name, answers, setAnswers }) => {
  console.log('Section1Component render – name:', name, 'answers:', answers);

  useEffect(() => {
    console.log('useEffect triggered – name:', name, 'answers:', answers);
    if (!name) {
      console.log('useEffect aborted – no name provided');
      return;
    }
    saveUserAnswers(name, answers)
      .then(() => console.log(`Saved answers for ${name}`))
      .catch(err => console.error('Error saving answers:', err));
  }, [answers, name]);

  const handleChange = (e) => {
    const { name: questionId, value } = e.target;
    console.log('handleChange – questionId:', questionId, 'value:', value);
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  
  const questions = [
    { id: 'q1', label: '1. 암 발병 전과 비교해서 무언가에 집중하기 어렵다.' },
    { id: 'q2', label: '2. 암 발병 전과 비교해서 무언가를 기억하는데 어려움이 있다.' },
    { id: 'q3', label: '3. 암 발병 전과 비교해서 성생활에 어려움을 느낀다.' },
    { id: 'q4', label: '4. 암 치료 이후 현재 우울감을 느낀다.' },
    { id: 'q5', label: '5. 암 발병 이후, 수면에 어려움이 있다.' },
    { id: 'q6', label: '6. 암 치료로 인해 일상생활에 불편함(예: 부종, 경직 등)을 느낀다.' },
    { id: 'q7', label: '7. 체력 저하로 인해 피로감을 느낀다.' },
    { id: 'q8', label: '8. 암 발병 전과 비교해서 적정 체중을 유지하기 어렵다.' }
  ];

  const options = [
    { value: '1', label: '전혀 그렇지 않다' },
    { value: '2', label: '약간 그렇지 않다' },
    { value: '3', label: '보통이다' },
    { value: '4', label: '약간 그렇다' },
    { value: '5', label: '매우 그렇다' }
  ];

  
  return (
    <Box
      sx={{
        backgroundColor: 'background.paper',  // theme.palette.background.paper (#fff)
        p: 3,
        borderRadius: 2,
        boxShadow: 1
      }}
    >
      {questions.map((q) => (
        <FormControl
          component="fieldset"
          key={q.id}
          fullWidth
          sx={{ mb: 3 }}
        >
          <FormLabel
            component="legend"
            sx={{
              fontWeight: 'bold',
              color: 'primary.main',  // theme.palette.primary.main (#397FE2)
              mb: 1
            }}
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
              sx={{ my: 0.5 }}
              componentsProps={{
              typography: {
              sx: {
              color: 'text.secondary'
      }
    }
  }}
/>

            ))}
          </RadioGroup>
        </FormControl>
      ))}
    </Box>
  );
};

export default Section1Component;
