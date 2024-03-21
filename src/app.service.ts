import {
  ChainCallDTO,
  GalaChainResponse,
  GetMyProfileDto,
  RegisterEthUserDto,
  UserProfile,
  createValidDTO,
} from '@gala-chain/api';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { execSync } from 'child_process';
import { ChainClient, RestApiClientConfig, gcclient, HFClientConfig } from '@gala-chain/client';
import * as path from 'path';
import { ethers } from 'ethers';
import { SaveAiHumanDto } from './types';
import { readFileSync } from 'fs';
import { plainToInstance } from "class-transformer";
import { ISaveAiHuman } from './app.controller';

interface CustomAPI {
  GetProfile(privateKey: string): Promise<UserProfile>;
  SaveAiHuman(privateKey: string, userIdentity: string, uuid: string): Promise<any>;
}


@Injectable()
export class AppService {
  client: ChainClient & CustomAPI;
  registerClient: ChainClient & CustomAPI;
  aiHumanClient: ChainClient & CustomAPI;

  constructor() {
    // todo: harcoded for POC / local dev 
    const params: HFClientConfig = {
      orgMsp: 'CuratorOrg',
      userId: 'admin',
      userSecret: 'adminpw',
      connectionProfilePath: path.resolve(
        'connection-profiles/sample-cpp-curator.json',
      ),
    };

    // todo: hardcoded for POC
    const api: RestApiClientConfig = {
      orgMsp: 'CuratorOrg',
      userId: 'admin',
      userSecret: 'adminpw',
      apiUrl: process.env.API_URL ?? "https://localhost:3000",
      configPath: path.resolve(
        'connection-profiles./sample-api-config.json',
      ),
    }

    const contract = {
      channelName: 'product-channel',
      chaincodeName: 'basic-product',
      contractName: 'AiHumanContract',
    };

    const publicKeyContract = {
      channelName: 'product-channel',
      chaincodeName: 'basic-product',
      contractName: 'PublicKeyContract',
    };

    const aiHumanContract = {
      channelName: 'product-channel',
      chaincodeName: 'basic-product',
      contractName: 'AiHumanContract',
    }

    if (process.env.NODE_ENV === "localdev") {
      // for a locally deployed galachain network
      this.client = gcclient
      .forConnectionProfile(params)
      .forContract(contract)
      .extendAPI(this.customAPI);

      this.registerClient = gcclient
        .forConnectionProfile(params)
        .forContract(publicKeyContract)
        .extendAPI(this.customAPI);

      this.aiHumanClient = gcclient
        .forConnectionProfile(params)
        .forContract(aiHumanContract)
        .extendAPI(this.customAPI);
    } else {
      // for a cloud deployed galachain network
      this.registerClient = gcclient
        .forApiConfig(api)
        .forContract(publicKeyContract)
        .extendAPI(this.customAPI);

      this.client = gcclient
        .forConnectionProfile(params)
        .forContract(contract)
        .extendAPI(this.customAPI);

      this.aiHumanClient = gcclient
        .forConnectionProfile(params)
        .forContract(aiHumanContract)
        .extendAPI(this.customAPI);
    }
  }

  generateEthereumWallet() {
    const randomWallet = ethers.Wallet.createRandom();

    console.log('Private Key:', randomWallet.privateKey);
    console.log('Public Key:', randomWallet.publicKey);
    return {
      privateKey: randomWallet.privateKey,
      publicKey: randomWallet.publicKey,
    };
  }

  public async saveAiHuman(params: ISaveAiHuman) {
    const dto = new SaveAiHumanDto(params.userIdentity, params.uuid);
    return await this.client.submitTransaction("SaveAiHuman", dto);
  }

  async registerUser(privateKey: string, publicKey: string) {
    const dto: RegisterEthUserDto = await createValidDTO<RegisterEthUserDto>(
      RegisterEthUserDto,
      {
        publicKey,
      },
    );
    return this.registerClient.submitTransaction(
      'RegisterEthUser',
      dto.signed(privateKey),
    );
  }

  customAPI(client: ChainClient): CustomAPI {
    return {
      async GetProfile(privateKey: string) {
        const dto = new GetMyProfileDto().signed(privateKey, false);
        const response = await client.evaluateTransaction(
          'GetMyProfile',
          dto,
          UserProfile,
        );
        if (GalaChainResponse.isError(response)) {
          throw new Error(
            `Cannot get profile: ${response.Message} (${response.ErrorKey})`,
          );
        } else {
          return response.Data as UserProfile;
        }
      },
      async SaveAiHuman(privateKey: string, userIdentity: string, uuid: string) {
        const dto = new SaveAiHumanDto(userIdentity, uuid).signed(privateKey);
        const response = await client.submitTransaction('SaveAiHuman', dto);
        if (GalaChainResponse.isError(response)) {
          return `Cannot get profile: ${response.Message} (${response.ErrorKey})`;
        } else {
          return response.Data;
        }
      },
    };
  }

  private async execCommand(command: string): Promise<string> {
    try {
      const output = execSync(command, { encoding: 'utf-8' }); // the output will be a String
      return output;
    } catch (error) {
      console.error(`Error executing command: ${command}`, error);
      throw error;
    }
  }

  private async dtoSign(dto: ChainCallDTO): Promise<ChainCallDTO> {
    const sk = process.env.SERVER_ADMIN_SIGNING_KEY ?? readFileSync("dev-admin-key/dev-admin.priv.hex.txt").toString();

    const signedDto = dto.signed(sk);

    return signedDto;
  }

  async enrollUser(): Promise<string> {
    const response = await axios.post('https://localhost:8801/user/enroll', {
      id: 'admin',
      secret: 'adminpw',
    });
    console.log('Enroll response:', response.data);
    return response.data.token;
  }

  async getMyProfile(token: string): Promise<any> {
    const dto = await this.dtoSign(
      plainToInstance(ChainCallDTO, {})
    );
    console.log('get_my_profile_dto:', dto);

    const payload = {
      method: 'PublicKeyContract:GetMyProfile',
      args: [dto],
    };

    const response = await axios.post(
      'https://localhost:8801/invoke/product-channel/basic-product',
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );
    console.log('Profile response:', response.data);
    return response.data;
  }
}

