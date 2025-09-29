// src/components/BackButton.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './BackButton.css';

export default function BackButton({ text = 'Voltar', to = '/dashboard' }) {
  const navigate = useNavigate();

  return (
    <button 
      onClick={() => navigate(to)} 
      className="back-button"
    >
      <span className="back-arrow">←</span>
      <span className="back-text">{text}</span>
    </button>
  );
}