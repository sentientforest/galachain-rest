import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

export interface ISaveAiHuman {
  userIdentity: string;
  uuid: string;
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Post('aihuman')
  async saveAiHuman(
    @Body() dto: ISaveAiHuman,
  ) {

    return this.appService.saveAiHuman(dto);
  }

  @Post('create-eth')
  async createUser() {
    return this.appService.generateEthereumWallet();
  }

  @Post('register-eth/:public')
  async registerUser(@Param('public') publicKey: string) {
    const [pk, sk] = this.getAdminUser();
    return this.appService.registerUser(sk, pk);
  }

  getAdminUser() {
    const publicKey =
      process.env.TEST_ADMIN_PUBLIC_KEY ??
      fs
        .readFileSync(
          path.resolve('dev-admin-key/dev-admin.pub.hex.txt'),
          'utf-8',
        )
        .toString();

    const privateKey =
      process.env.TEST_ADMIN_PRIVATE_KEY ??
      fs
        .readFileSync(
          path.resolve('dev-admin-key/dev-admin.priv.hex.txt'),
          'utf-8',
        )
        .toString();

    return [publicKey, privateKey];
  }
}
