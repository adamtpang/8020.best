import React from 'react';
import { Container } from 'react-bootstrap';
import Landing from './Landing';
import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <main className="flex-grow-1">
        <Landing />
      </main>
      <footer className="mt-auto py-3 bg-light">
        <Container className="text-center">
          <span className="text-muted">&copy; 2024 Hower App. All rights reserved.</span>
        </Container>
      </footer>
    </div>
  );
};

export default App;