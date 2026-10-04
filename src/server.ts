import { app } from './app.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5001;

app.listen(PORT, () => {
  console.log(`🚀 WhirlDispatch Backend API running on port ${PORT}`);
  console.log(`🩺 Health check available at http://localhost:${PORT}/api/health`);
});
