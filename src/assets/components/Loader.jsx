import React from 'react';
import './Loader.css';

const Loader = () => {
  return (
    <div className="loader-container">
      <div className="loader-spinner"></div>
      <p>Analisando a tabela...</p>
    </div>
  );
};

export default Loader;