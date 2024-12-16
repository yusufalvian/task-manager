import './App.css'
import Login from './Login';
import Tasks from './Tasks';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import { AuthProvider } from './AuthContext';

// root component 
function App() {
  return (
    <AuthProvider>
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/tasks" element={<PrivateRoute element={<Tasks />} />} />
      </Routes>
    </Router>
    </AuthProvider>
  );  
}



export default App
