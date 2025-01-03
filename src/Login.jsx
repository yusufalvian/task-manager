import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import {
  TextField,
  Button,
  Checkbox,
  Box,
  Paper,
  Typography,
  FormControlLabel,
  CircularProgress
} from '@mui/material';

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

      // if successful, navigate to path "/tasks"
      // component for "/tasks" path is defined in App.jsx 
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
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      bgcolor: '#e6f2ff',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h5" sx={{ color: '#1e40af', textAlign: 'center', mb: 3 }}>
          Login
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            type="email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Email"
            variant="outlined"
          />
          <TextField
            fullWidth
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            variant="outlined"
            slotProps={{
              input: {
                endAdornment: (
                  <Button
                    onClick={() => setShowPassword(!showPassword)}
                    sx={{ minWidth: 'auto', p: 0 }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </Button>
                ),
              },
            }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                color="primary"
              />
            }
            label="Remember Me"
          />
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            fullWidth
            sx={{ mt: 2 }}
          >
            {loading && <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />}
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
