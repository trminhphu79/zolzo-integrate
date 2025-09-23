import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZolozCallerService } from './zoloz-caller.service';
import { H5InitializeDto, InitializeResponseDto } from './initialize.dto';
import { CheckResultRequestDto, CheckResultResponseDto } from './result.dto';

@ApiTags('RealID')
@Controller('api/realid')
export class RealIdController {
  constructor(private readonly zoloz: ZolozCallerService) {}

  @Post('test-zolzo')
  @ApiOperation({ summary: 'Test zolzo api' })
  @ApiResponse({ status: 200 })
  async callAmlAnalyze() {
    return await this.zoloz.callAmlAnalyze({
      bizCode: 'TEST',
      extendData: {
        certName: 'test',
        gender: 'male',
        nationality: 'u',
      },
      tenantID: 'TEST',
      tntInstID: 'GLOBAL',
    });
  }

  @Post('h5initialize')
  @ApiOperation({ summary: 'Initialize RealId H5 flow (ZOLOZ)' })
  @ApiBody({ type: H5InitializeDto })
  @ApiResponse({ status: 200, type: InitializeResponseDto })
  async h5Initialize(
    @Body() body: H5InitializeDto,
  ): Promise<InitializeResponseDto> {
    const apiResp = await this.zoloz.callInitialize(body);
    return apiResp as InitializeResponseDto;
  }

  @Post('checkresult')
  @ApiOperation({ summary: 'Check RealId transaction result (ZOLOZ)' })
  @ApiBody({ type: CheckResultRequestDto })
  @ApiResponse({ status: 200, type: CheckResultResponseDto })
  async checkResult(@Body() body: CheckResultRequestDto) {
    return this.zoloz.callCheckResult({
      bizId: `dummy_bizid_${Date.now()}`,
      transactionId: body.transactionId,
      isReturnImage: body.isReturnImage ?? 'N',
    });
  }
}
