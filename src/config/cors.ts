import cors, { CorsOptions } from 'cors';

const allowedOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((origin) => origin.trim());

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. native iOS URLSession, Postman)
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy rejection: origin '${origin}' not authorized.`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-Biometric-Session',
  ],
  exposedHeaders: ['Authorization'],
  credentials: true,
  maxAge: 86400, // 24 hours preflight caching
};

export const corsMiddleware = cors(corsOptions);
