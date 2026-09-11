import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import apiRouter from './routes';
import { errorHandler } from './middleware/errorHandler';
import { prisma } from './prisma';
import { execSync } from 'child_process';

// Auto-sync database schema and auto-seed on launch
(async () => {
  try {
    console.log('🔄 Checking database schema sync...');
    try {
      execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
    } catch (e: any) {
      console.log('ℹ️ Schema push note:', e?.message || e);
    }

    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('🌱 Database is empty. Running auto-seed for initial roles & inventory...');
      try {
        execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
        console.log('✅ Auto-seed completed successfully!');
      } catch (seedErr: any) {
        console.error('Seed execution note:', seedErr?.message || seedErr);
      }
    } else {
      console.log(`✅ Database ready. Found ${userCount} registered users.`);
    }
  } catch (err: any) {
    console.log('ℹ️ Database startup check info:', err?.message || err);
  }
})();

const app = express();

// Middlewares
app.use(cors({
  origin: '*', // Allow frontend client
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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
