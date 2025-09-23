import {
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ResultCode,
  RealIdResultStatus,
  ServiceLevel,
} from 'src/enums/zolzo.enum';

export class NameOnlyDto {
  @ApiProperty({ example: 'hologram' })
  @IsString()
  name!: string;
}

export class FaceAttributeDetailsDto {
  @ApiProperty({
    isArray: true,
    type: String,
    example: ['eyesOcclusion', 'noseOcclusion'],
  })
  @IsArray()
  @IsString({ each: true })
  details!: string[];

  @ApiProperty({ example: 'Y', enum: ['Y', 'N'] })
  @IsIn(['Y', 'N'])
  detectOpen!: 'Y' | 'N';

  @ApiProperty({ example: 'Y', enum: ['Y', 'N'] })
  @IsIn(['Y', 'N'])
  needRetry!: 'Y' | 'N';
}

export class FaceAttributeCheckDto {
  @ApiPropertyOptional({ type: FaceAttributeDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FaceAttributeDetailsDto)
  occlusionCheck?: FaceAttributeDetailsDto;

  @ApiPropertyOptional({ type: FaceAttributeDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FaceAttributeDetailsDto)
  maskCheck?: FaceAttributeDetailsDto;

  @ApiPropertyOptional({ type: FaceAttributeDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FaceAttributeDetailsDto)
  glassesCheck?: FaceAttributeDetailsDto;

  @ApiPropertyOptional({ type: FaceAttributeDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FaceAttributeDetailsDto)
  hatCheck?: FaceAttributeDetailsDto;
}

export class ConsistencyCheckCommonDto {
  @ApiProperty({ example: 'commonConsistencyCheck' })
  @IsString()
  type!: string;
}

export class ConsistencyCheckWithDetailsDto {
  @ApiProperty({ example: 'mrzVisualConsistencyCheck' })
  @IsString()
  type!: string;

  @ApiProperty({ isArray: true, type: String, example: ['NAME', 'SEX'] })
  @IsArray()
  @IsString({ each: true })
  details!: string[];
}

export class ConsistencyCheckCountryDto {
  @ApiProperty({ example: 'passportCountryCheck' })
  @IsString()
  type!: string;

  @ApiProperty({ isArray: true, type: String, example: ['CHN', 'PHL'] })
  @IsArray()
  @IsString({ each: true })
  valueRange!: string[];
}

export class TimeWindowDto {
  @ApiProperty({ example: 1724222116300, description: 'startTime epoch ms' })
  @IsNumber()
  startTime!: number;

  @ApiProperty({ example: 1724377636300, description: 'endTime epoch ms' })
  @IsNumber()
  endTime!: number;
}

export class AdvancedIdnRiskDetectionDto {
  @ApiProperty({
    isArray: true,
    type: String,
    example: ['IDFAKE', 'DUPLICATE', 'BATCH_REGISTER', 'DEEPFAKE'],
  })
  @IsArray()
  @IsString({ each: true })
  riskTypes!: string[];

  @ApiProperty({ type: TimeWindowDto })
  @ValidateNested()
  @Type(() => TimeWindowDto)
  timeWindow!: TimeWindowDto;
}

export class ProductConfigDto {
  @ApiPropertyOptional({ example: 'STANDARD' })
  @IsOptional()
  @IsString()
  deeperMode?: string;

  @ApiPropertyOptional({ example: 'Y', enum: ['Y', 'N'] })
  @IsOptional()
  @IsIn(['Y', 'N'])
  cropDocImage?: 'Y' | 'N';

  @ApiPropertyOptional({ isArray: true, type: NameOnlyDto })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => NameOnlyDto)
  landmarkCheck?: NameOnlyDto[];

  @ApiPropertyOptional({ isArray: true, type: NameOnlyDto })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => NameOnlyDto)
  hologramCheck?: NameOnlyDto[];

  @ApiPropertyOptional({ isArray: true, type: NameOnlyDto })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => NameOnlyDto)
  pageInfoCheck?: NameOnlyDto[];

  @ApiPropertyOptional({ example: 'Y', enum: ['Y', 'N'] })
  @IsOptional()
  @IsIn(['Y', 'N'])
  preciseTamperCheck?: 'Y' | 'N';

  @ApiPropertyOptional({ example: 'Y', enum: ['Y', 'N'] })
  @IsOptional()
  @IsIn(['Y', 'N'])
  allowExpiredDocument?: 'Y' | 'N';

  @ApiPropertyOptional({ type: FaceAttributeCheckDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FaceAttributeCheckDto)
  faceAttributeCheck?: FaceAttributeCheckDto;

  @ApiPropertyOptional({
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  consistencyCheck?: Array<
    | ConsistencyCheckCommonDto
    | ConsistencyCheckWithDetailsDto
    | ConsistencyCheckCountryDto
  >;

  @ApiPropertyOptional({ type: AdvancedIdnRiskDetectionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AdvancedIdnRiskDetectionDto)
  advancedIdnRiskDetection?: AdvancedIdnRiskDetectionDto;

  @ApiPropertyOptional({ example: '3' })
  @IsOptional()
  @IsString()
  advancedIdnThreshold?: string;

  @ApiPropertyOptional({ example: 'Y', enum: ['Y', 'N'] })
  @IsOptional()
  @IsIn(['Y', 'N'])
  checkAdvancedIdn?: 'Y' | 'N';

  @ApiPropertyOptional({ example: 'Y', enum: ['Y', 'N'] })
  @IsOptional()
  @IsIn(['Y', 'N'])
  checkBlacklist?: 'Y' | 'N';
}

export class H5ModeConfigDto {
  @ApiProperty({ example: 'https://testing.com' })
  @IsUrl()
  completeCallbackUrl!: string;
  @ApiProperty({ example: 'https://testing.com' })
  @IsUrl()
  interruptCallbackUrl!: string;

  @ApiPropertyOptional({ example: 'Y', enum: ['Y', 'N'] })
  @IsOptional()
  @IsIn(['Y', 'N'])
  allowDegradation?: 'Y' | 'N';

  @ApiPropertyOptional({ example: 'https://testing.com' })
  @IsOptional()
  @IsUrl()
  docFrontPageGuideUrl?: string;

  @ApiPropertyOptional({ example: 'https://testing.com' })
  @IsOptional()
  @IsUrl()
  docBackPageGuideUrl?: string;

  @ApiPropertyOptional({ example: 'https://testing.com' })
  @IsOptional()
  @IsUrl()
  facePageGuideUrl?: string;

  @ApiPropertyOptional({
    description: 'JSON string for UI config',
    example:
      '{"titlebarbgcolor":"#ffffff","titlebartextcolor":"#000000","buttoncolor":"#3696fd","isDesktop":"Y"}',
  })
  @IsOptional()
  @IsString()
  uiCfg?: string;

  @ApiPropertyOptional({ example: 'Y', enum: ['Y', 'N'] })
  @IsOptional()
  @IsIn(['Y', 'N'])
  enableUpload?: 'Y' | 'N';
}

export class PageConfigDto {
  @ApiPropertyOptional({ example: 'http://xxxxxx.html' })
  @IsOptional()
  @IsUrl()
  urlFaceGuide?: string;
}

export class H5InitializeDto {
  @ApiProperty({ example: '2017839040588699' })
  @IsString()
  bizId!: string;

  @ApiProperty({ example: 'H5_REALIDLITE_KYC' })
  @IsString()
  flowType!: string;

  @ApiProperty({ example: '123456abcd' })
  @IsString()
  userId!: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['00630000032', '00630000004'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  autoDocTypes?: string[];

  @ApiPropertyOptional({
    type: Object,
    example: { '00630000032': '1', '00630000004': '1,2' },
  })
  @IsOptional()
  @IsObject()
  autoDocPages?: Record<string, string>;

  @ApiPropertyOptional({ type: PageConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PageConfigDto)
  pageConfig?: PageConfigDto;

  @ApiPropertyOptional({
    description: 'Service level mode for ZOLOZ RealId',
    enum: ServiceLevel,
    example: ServiceLevel.REALID0001,
  })
  @IsOptional()
  @IsEnum(ServiceLevel)
  serviceLevel?: ServiceLevel;

  @ApiPropertyOptional({ example: 'STANDARD' })
  @IsOptional()
  @IsString()
  operationMode?: string;

  @ApiPropertyOptional({ type: ProductConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductConfigDto)
  productConfig?: ProductConfigDto;

  @ApiProperty({ example: 'MOB_H5' })
  @IsString()
  metaInfo!: string;

  @ApiProperty({ type: H5ModeConfigDto })
  @ValidateNested()
  @Type(() => H5ModeConfigDto)
  h5ModeConfig!: H5ModeConfigDto;
}

export class RealIdResultDto {
  @ApiProperty({
    enum: RealIdResultStatus,
    example: RealIdResultStatus.SUCCESS,
  })
  @IsEnum(RealIdResultStatus)
  resultStatus!: RealIdResultStatus;

  @ApiProperty({
    enum: ResultCode,
    example: ResultCode.SUCCESS,
  })
  @IsEnum(ResultCode)
  resultCode!: ResultCode;

  @ApiProperty({
    description: 'Detailed message about the result',
    example: 'The API call is successful.',
  })
  @IsString()
  resultMessage!: string;
}

export class InitializeResponseDto {
  @ApiProperty({ type: RealIdResultDto })
  result!: RealIdResultDto;

  @ApiProperty({ example: 'G000000005FID20200304000000000001570702' })
  transactionId!: string;

  @ApiProperty({ description: 'Opaque client configuration for ZOLOZ Web SDK' })
  clientCfg!: string;
}
