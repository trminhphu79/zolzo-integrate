import { Global, Module } from '@nestjs/common';
import { TwoWayAuthProtocolService } from './two-way-auth.protocol';
import { RealIdController } from './zolzo.controller';
import { ZolozCallerService } from './zoloz-caller.service';

@Global()
@Module({
  providers: [
    ZolozCallerService,
    {
      provide: TwoWayAuthProtocolService,
      useFactory: () =>
        new TwoWayAuthProtocolService(
          process.env.ZOLOZ_CLIENT_ID!,
          process.env.MERCHANT_PRIVATE_KEY_B64!,
          process.env.ZOLOZ_PUBLIC_KEY_B64!,
          true,
          true,
          256,
        ),
    },
  ],
  controllers: [RealIdController],
  exports: [TwoWayAuthProtocolService],
})
export class ZolozModule {}
