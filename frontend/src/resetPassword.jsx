// ResetPassword.jsx
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    try {
        const res = await axios.post(`http://localhost:5000/reset-password/${token}`, {
          newPassword: password
        });
        alert(res.data.message);
      } catch (err) {
        console.error(err);
      }
  };

  return (
    <form onSubmit={handleReset}>
      <h2>Reset Password</h2>
      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Reset</button>
    </form>
  );
};

export default ResetPassword;
