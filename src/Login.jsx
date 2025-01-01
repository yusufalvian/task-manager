import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';
import { Visibility, VisibilityOff } from '@mui/icons-material';

// loading spinner animation 
// used to show loading state in login button
const Spinner = () => (
  <div style={styles.spinnerContainer}>
    <div style={styles.spinner}></div>
  </div>
);

// login component
const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // react router to navigate to "tasks" page when login is successful
  const navigate = useNavigate();

  // 'remember me' feature
  // check for saved email on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setUsername(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // set loading to true at the start

    // simple validation
    if (username === '' || password === '') {
      setError('Both fields are required.');
      setLoading(false); // set loading to false if validation fails
      return;
    }

    try {

      // handle remember me
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', username);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      // sign in with Firebase
      await signInWithEmailAndPassword(auth, username, password);

      // ff successful, navigate to tasks page
      navigate('/tasks');

    } catch (error) {
      console.log(error)
      // handle firebase auth errors
      switch (error.code) {
        case 'auth/invalid-email':
          setError('Invalid email address format.');
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError('Invalid email or password.');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed login attempts. Please try again later.');
          break;
        default:
          setError('Failed to login. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Login</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <input
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Email"
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <div style={styles.passwordContainer}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                style={styles.input}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </button>
            </div>
          </div>
          <div style={styles.rememberMeContainer}>
            <label style={styles.rememberMeLabel}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={styles.checkbox}
              />
              Remember Me
            </label>
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <button 
            type="submit" 
            style={{
              ...styles.button,
              width: '100%',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
            }}
            disabled={loading}
          >
            {loading && <Spinner />}
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

// styles for the login page
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#e6f2ff', // Light blue background
    margin: 0,
    padding: 0,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    padding: '2rem',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    color: '#1e40af', // Dark blue
    textAlign: 'center',
    marginBottom: '1.5rem',
    fontSize: '1.5rem',
    fontWeight: 'bold',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputGroup: {
    marginBottom: '1rem',
    width: '100%',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#f3f4f6', // Light grey background
    color: '#4b5563', // Dark grey text color
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
  },
  eyeButton: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#4a5568',
  },
  rememberMeContainer: {
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
  },
  rememberMeLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#666',
  },
  checkbox: {
    cursor: 'pointer',
  },
  button: {
    backgroundColor: '#3b82f6', // Blue
    color: 'white',
    padding: '0.75rem',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative',
  },
  error: {
    color: '#e53e3e', // Red
    marginBottom: '1rem',
    fontSize: '0.875rem',
  },
  signupText: {
    textAlign: 'center',
    marginTop: '1rem',
    fontSize: '0.875rem',
    color: '#4a5568',
  },
  signupLink: {
    color: '#3b82f6', // Blue
    textDecoration: 'none',
  },
  spinnerContainer: {
    display: 'inline-block',
    width: '16px',
    height: '16px',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '50%',
    borderTopColor: '#fff',
    animation: 'spin 0.8s linear infinite',
  },
};

// keyframes for the loading spinner
const spinKeyframes = `
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
const styleTag = document.createElement('style');
styleTag.innerHTML = spinKeyframes;
document.head.appendChild(styleTag);

export default Login;
