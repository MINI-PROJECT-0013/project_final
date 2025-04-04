// Toast.js
import React from 'react';
import './Toast.css'; // Import your CSS file for styling

const Toast = ({ message, type }) => {
    return (
      <div className={`toast ${type}`}>
        {message}
      </div>
    );
  };
  

export default Toast;
