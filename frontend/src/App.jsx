import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Product from './components/Product';
import Landing from './components/Landing';

function App() {
  return (
    <Router basename="/">
      <Routes>
        <Route path="/app" element={<Product />} />
        <Route path="/" element={<Landing />} />
      </Routes>
    </Router>
  );
}

export default App;