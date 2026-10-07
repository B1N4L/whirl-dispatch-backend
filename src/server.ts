import { app } from './app';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5001;

app.listen(PORT, () => {
  console.log(`WhirlDispatch Backend API listening on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/api/health`);
});
