/*
 * Copyright (c) Gala Games Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  ChainKey,
  ChainObject,
} from "@gala-chain/api";
import { Exclude } from "class-transformer";
import { ChainCallDTO } from "@gala-chain/api";
import { IsString, IsOptional, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class AiHuman extends ChainObject {
  @Exclude()
  static INDEX_KEY = "GCAIH";

  @ChainKey({ position: 0 })
  @IsString()
  public readonly userIdentity: string;

  @ChainKey({ position: 1 })
  @IsString()
  public readonly uuid: string;

  constructor(userIdentity: string, uuid: string) {
    super();
    this.userIdentity = userIdentity;
    this.uuid = uuid;
  }
}

export class SaveAiHumanDto extends ChainCallDTO {
  @IsString()
  public readonly userIdentity: string;

  @IsString()
  public readonly uuid: string;

  constructor(userIdentity: string, uuid: string) {
    super();
    this.userIdentity = userIdentity;
    this.uuid = uuid;
  }
}

export class FetchAiHumansDto extends ChainCallDTO {
  @IsOptional()
  @IsString()
  public readonly userIdentity?: string;

  @IsOptional()
  @IsString()
  public readonly uuid?: string;

  @IsString()
  @IsOptional()
  public readonly bookmark?: string;

  @IsOptional()
  public readonly limit?: number;

  constructor(userIdentity?: string, uuid?: string, bookmark?: string, limit?: number) {
    super();
    this.userIdentity = userIdentity;
    this.uuid = uuid;
    this.bookmark = bookmark;
    this.limit = limit;
  }
}

export class PagedAiHumansDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AiHuman)
  public readonly aiHumans: AiHuman[];

  @IsString()
  public readonly bookmark: string;

  constructor(aiHumans: AiHuman[], bookmark: string) {
    this.aiHumans = aiHumans;
    this.bookmark = bookmark;
  }
}
