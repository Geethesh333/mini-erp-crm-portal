import express from 'express';
import cors from 'cors';
import { config } from './config';
import apiRouter from './routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Middlewares
app.use(cors({
  origin: '*', // Allow frontend client
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Mini ERP + CRM API',
    time: new Date().toISOString(),
  });
});

// API Routes mounted on both /api and root /
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Global Error Handler
app.use(errorHandler);

// Start server on 0.0.0.0 so all network interfaces can access it
app.listen(config.port, '0.0.0.0', () => {
  console.log(`🚀 Mini ERP + CRM Server running on port ${config.port} [${config.nodeEnv}]`);
  console.log(`📡 API available at http://localhost:${config.port}/api and http://localhost:${config.port}/`);
});

export default app;
