// src/components/BackButton.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './BackButton.css';

export default function BackButton({ text = 'Voltar', to = null }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      // Se foi passado um destino específico, vai para ele
      navigate(to);
    } else {
      // Caso contrário, volta para a página anterior no histórico
      navigate(-1);
    }
  };

  return (
    <button 
      onClick={handleClick} 
      className="back-button"
    >
      <span className="back-arrow">←</span>
      <span className="back-text">{text}</span>
    </button>
  );
}