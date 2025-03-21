import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser'
import cors from 'cors'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.use(
    cors({
      origin: function (origin, callback) {
        const allowedOrigins = ['http://localhost:3500'];
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    }),
  );
  const port =
  process.env.NODE_ENV === 'development'
    ? process.env.PORT_DEV
    : process.env.PORT_PROD;
await app.listen(port);
console.log(`Application is running port: ${port}`);
}
bootstrap();
