// src/App.js

// App.js

import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './components/Landing';
import Product from './components/Product';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ThemeProvider theme={theme}>

      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <Product />
              </ProtectedRoute>
            }
          />
          {/* Other routes if needed */}
        </Routes>
      </Router>
    </ThemeProvider>

  );
}

export default App;
