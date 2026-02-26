import React from 'react';
import { FaSpinner } from 'react-icons/fa';

const Loader = ({ size = 'medium', text = 'Loading...' }) => {
  const sizeClass = `loader--${size}`;

  return (
    <div className={`loader ${sizeClass}`}>
      <FaSpinner className="loader__spinner" />
      {text && <span className="loader__text">{text}</span>}
    </div>
  );
};

export default Loader;