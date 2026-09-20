import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start HTTP Server
    app.listen(Number(env.PORT), () => {
      console.log(`🚀 ETM Backend running in development mode on http://localhost:${env.PORT}`);
      console.log(`📡 Health check available at http://localhost:${env.PORT}/api/v1/health`);
    });
  } catch (error: any) {
    console.error(`❌ Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
