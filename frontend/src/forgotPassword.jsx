// ForgotPassword.jsx
import { useState } from 'react';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const res = await axios.post('http://localhost:5000/forgot-password', {
        email: email.trim()
        });
        alert(res.data.message);
    } catch (err) {
        console.error(err);
        alert(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="container">
      <h2>Forgot Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Send Reset Link</button>
      </form>
    </div>
  );
};

export default ForgotPassword;
