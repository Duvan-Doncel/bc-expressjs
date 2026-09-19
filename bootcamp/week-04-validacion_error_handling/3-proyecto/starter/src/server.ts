import app from './app';
import { logger } from './config/logger';

const PORT = process.env['PORT'] ? Number(process.env['PORT']) : 3000;

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
