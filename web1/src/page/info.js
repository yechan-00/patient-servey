// src/page/info.js
import React from 'react';
import { Container } from '@mui/material';
import SurveyForm from '../component/SurveyForm'; // 🔁 파일명 반영

const Info = () => {
  return (
    <Container
      maxWidth="md"
      sx={{ py: 4, background: 'none', bgcolor: 'background.default' }}
    >
      <SurveyForm />
    </Container>
  );
};

export default Info;
