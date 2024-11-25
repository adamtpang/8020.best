import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom';
import Product from './components/Product';
import Landing from './components/Landing';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/app" element={
          // If refreshing on /app, redirect to /
          window.performance.navigation.type === 1 ?
            <Navigate to="/" replace /> :
            <Product />
        } />
        <Route path="/" element={<Landing />} />
      </Routes>
    </Router>
  );
}

export default App;