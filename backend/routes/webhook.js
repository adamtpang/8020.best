app.post('/webhook', async (req, res) => {
  try {
    console.log('Webhook received');

    // Get raw body as a Buffer
    const rawBody = await getRawBody(req, {
      length: req.headers['content-length'],
      limit: '1mb',
      encoding: null // Ensure rawBody is a Buffer
    });

    console.log('Request details:', {
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
      rawBodyLength: rawBody.length,
      signature: req.headers['stripe-signature']?.slice(0, 20) + '...'
    });

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY?.trim());
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

    // Verify webhook using rawBody as a Buffer
    const event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      endpointSecret
    );

    console.log('Event verified:', event.type);

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('Processing session:', session.id);

      const Purchase = require('./models/Purchase');
      await Purchase.findOneAndUpdate(
        { email: session.customer_email },
        {
          $set: {
            hasPurchased: true,
            purchaseDate: new Date(),
            stripeSessionId: session.id
          }
        },
        { upsert: true }
      );

      console.log('Purchase recorded for:', session.customer_email);
    }

    // Send success response
    res.json({ received: true });

  } catch (err) {
    console.error('Webhook error:', {
      message: err.message,
      stack: err.stack?.split('\n')[0]
    });
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});
