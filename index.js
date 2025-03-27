import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import otpRoutes from './routes/otpRoutes.js';

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'clientId', 'clientSecret']
}));

app.use('/api', otpRoutes);
app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from Node.js!' });
  });
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));