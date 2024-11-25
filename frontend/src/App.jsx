import { BrowserRouter as Router } from 'react-router-dom';

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