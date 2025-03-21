import { Global, Module } from '@nestjs/common';
import {WinstonModule} from 'nest-winston'
import winston from 'winston';
@Global()
@Module({
    imports: [
        WinstonModule.forRoot({
            level: 'debug',
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
            ),
            transports: [new winston.transports.Console()],
          }),
    ]
})
export class CommonModule {}
