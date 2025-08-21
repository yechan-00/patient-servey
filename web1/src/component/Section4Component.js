// src/components/Section4Component.js
// Section4: 심리적 부담 질문 (Q18~Q25)

import React, { useEffect } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';

import { saveUserAnswers } from '../utils/firebaseUtils';  // Firebase 저장 함수 import 추가

// props에 name 추가
const Section4Component = ({ name, answers, setAnswers }) => {
  // answers 변경 시마다 Firestore에 저장
  useEffect(() => {
    console.log('Section4Component useEffect – name:', name, 'answers:', answers);
    if (!name) {
      console.log('useEffect aborted – no name provided');
      return;
    }
    saveUserAnswers(name, answers)
      .then(() => console.log(`Saved Section4 answers for ${name}`))
      .catch(err => console.error('Error saving Section4 answers:', err));
  }, [answers, name]);
  const questions = [
    { id: 'q18', label: '18. 암 치료 및 건강관리와 관련해서 가족과 의견차이가 있다.' },
    { id: 'q19', label: '19. 재발에 대한 불안을 느낀다.' },
    { id: 'q20', label: '20. 죽음에 대한 두려움이 있다.' },
    { id: 'q21', label: '21. 앞으로의 인생에 대한 걱정이 있다.' },
    { id: 'q22', label: '22. 암 진단 및 치료를 생각하면 지금도 두려움을 느낀다.' },
    { id: 'q23', label: '23. 암으로 인해 건강관리를 해야 된다는 생각 때문에 스트레스를 받는다.' },
    { id: 'q24', label: '24 암 진단 후, 가정에서 내가 했던 역할(예: 엄마/아빠/아내/남편 등)의 변화로 인해 혼란을 경험한 적이 있다.' },
    { id: 'q25', label: '25. 암으로 인해 내가 해야 할 일을 제대로 하지 못한 것 때문에 죄책감을 느낀다.' }
  ];

  const options = [
    { value: '1', label: '전혀 그렇지 않다' },
    { value: '2', label: '약간 그렇지 않다' },
    { value: '3', label: '보통이다' },
    { value: '4', label: '약간 그렇다' },
    { value: '5', label: '매우 그렇다' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAnswers((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Box>
      {questions.map((q) => (
        <FormControl component="fieldset" key={q.id} sx={{ mb: 2 }} fullWidth>
          <FormLabel component="legend"
          sx={{ fontWeight: 'bold' ,color:"primary.main"}}
         
          >{q.label}</FormLabel>

          <RadioGroup 
          //row 
          name={q.id} 
          value={answers[q.id] || ''} 
          onChange={handleChange}>
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
  );
};

export default Section4Component;
