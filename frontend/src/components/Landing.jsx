import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Check2Circle } from 'react-bootstrap-icons';

const Landing = () => {
  const handlePurchase = () => {
    // Implement your purchase logic here
    alert('Redirecting to payment processing...');
  };

  const handleGoogleSignIn = (response) => {
    console.log("Encoded JWT ID token: " + response.credential);
    // Here you would send the token to your backend server and initiate the purchase process
  };

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <h1 className="display-4 fw-bold text-center mb-2">Hower</h1>
          <p className="lead text-center text-muted mb-5">Do less. Achieve more.</p>

          <Card className="mb-4 border-0 shadow-sm" style={{ backgroundColor: '#e6f2ff' }}>
            <Card.Body className="p-4">
              <Card.Title as="h2" className="h3 text-center mb-4">Simplify Your Tasks</Card.Title>
              <ul className="list-unstyled mb-0">
                {['Cut your to-do list by up to 90%', 'Focus on what truly matters', 'Eisenhower filtering built-in'].map((feature, index) => (
                  <li key={index} className="d-flex align-items-center mb-3">
                    <Check2Circle className="text-primary me-2" size={24} />
                    {feature}
                  </li>
                ))}
              </ul>
            </Card.Body>
          </Card>

          <div className="d-grid gap-3">
            <Button variant="primary" size="lg" onClick={handlePurchase}>
              Get Hower - $9.99/month
            </Button>
            <div id="g_id_onload"
                 data-client_id="YOUR_GOOGLE_CLIENT_ID"
                 data-context="signin"
                 data-ux_mode="popup"
                 data-callback={handleGoogleSignIn}
                 data-auto_prompt="false">
            </div>
            <div className="g_id_signin"
                 data-type="standard"
                 data-shape="rectangular"
                 data-theme="outline"
                 data-text="continue_with"
                 data-size="large"
                 data-logo_alignment="center">
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Landing;