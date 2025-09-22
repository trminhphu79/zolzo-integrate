import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ZolozModule } from './zolzo/zolzo.module';

@Module({
  imports: [ZolozModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
