import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('DATABASE_URL') || 'mongodb://localhost:27017/gbh_banking',
      }),
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}

