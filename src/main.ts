import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
// import cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  const origins = [
    'http://localhost:3300',
    'http://localhost:3000',
    'http://localhost:3700',
    'https://veepearls.com',
    'https://www.veepearls.com',
    'https://vee.my.id',
    'https://www.vee.my.id',
  ];
  app.enableCors({
    origin: function (origin, callback) {
      const allowedOrigins = origins;
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });
  const port =
    process.env.NODE_ENV === 'development'
      ? process.env.PORT_DEV
      : process.env.PORT_PROD;
  await app.listen(port);
  console.log(`Application is running port: ${port}`);
}
bootstrap();
