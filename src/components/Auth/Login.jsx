import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LuFeather } from "react-icons/lu";
import './Auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const providers = [
    {
      name: 'DeepSeek',
      logo: 'https://cdn.deepseek.com/platform/favicon.png'
    },
    {
      name: 'OpenAI',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg'
    },
    {
      name: 'Anthropic',
      logo: 'https://images.seeklogo.com/logo-png/51/2/anthropic-icon-logo-png_seeklogo-515014.png'
    },
    {
      name: 'Meta AI',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg'
    },
    {
      name: 'xAI',
      logo: 'https://x.ai/favicon.ico'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await signIn(email, password);
      navigate('/');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-content">
        <div className="product-info">
          <div className="model-header">
            <LuFeather className="model-logo" />
            <h2>LLM Project Docs Generator</h2>
          </div>
          <p className="model-description-login">
            A powerful AI-driven documentation generator that helps you create,
            maintain, and organize project documentation with advanced LLM capabilities.
            Featuring reproducible outputs, parallel processing, and intelligent
            content generation.
          </p>
          <div className="login-llm-providers">
            {providers.map((provider) => (
              <img 
                key={provider.name}
                src={provider.logo} 
                alt={provider.name} 
                className="login-provider-logo"
                title={provider.name}
              />
            ))}
          </div>
        </div>

        <div className="auth-card">
          <h2>Welcome Back</h2>
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <div className="auth-links">
            Need an account? <Link to="/signup">Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login; 