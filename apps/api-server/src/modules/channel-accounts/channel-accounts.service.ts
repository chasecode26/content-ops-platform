import { Injectable, NotFoundException } from "@nestjs/common";
import { AccountStatus, PlatformCode, Prisma } from "@prisma/client";

import { encryptCredentials, decryptCredentials, maskSecret } from "../../common/security/credential-crypto";
import { CreateChannelAccountDto } from "./dto/create-channel-account.dto";
import { UpdateChannelAccountDto } from "./dto/update-channel-account.dto";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ChannelAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, platform?: string) {
    await this.ensureUser(userId);
    const items = await this.prisma.channelAccount.findMany({
      where: {
        userId,
        ...(platform ? { platform: platform as PlatformCode } : {}),
      },
      orderBy: { updatedAt: "desc" },
    });
    return {
      items: items.map((account) => ({
        id: account.id,
        platform: account.platform,
        name: account.name,
        status: account.status,
        meta: account.meta ?? {},
        credential: this.buildCredentialSummary(account.credentialCiphertext),
        updatedAt: account.updatedAt.toISOString(),
      })),
    };
  }

  async create(userId: string, dto: CreateChannelAccountDto) {
    await this.ensureUser(userId);
    const account = await this.prisma.channelAccount.create({
      data: {
        userId,
        platform: dto.platform as PlatformCode,
        name: dto.name,
        status: AccountStatus.ACTIVE,
        credentialCiphertext: encryptCredentials(dto.credentials),
        meta: (dto.meta ?? {}) as Prisma.InputJsonValue,
      },
    });
    return {
      id: account.id,
      platform: account.platform,
      name: account.name,
      status: account.status,
      credential: this.buildCredentialSummary(account.credentialCiphertext),
    };
  }

  async validate(userId: string, accountId: string) {
    const account = await this.prisma.channelAccount.findFirst({
      where: { id: accountId, userId },
      select: { id: true, platform: true },
    });
    if (!account) {
      throw new NotFoundException("CHANNEL_ACCOUNT_NOT_FOUND");
    }
    return {
      valid: true,
      platform: account.platform,
      message: "account is valid",
    };
  }

  async update(userId: string, accountId: string, dto: UpdateChannelAccountDto) {
    const existing = await this.prisma.channelAccount.findFirst({
      where: { id: accountId, userId },
      select: {
        id: true,
        name: true,
        credentialCiphertext: true,
        meta: true,
      },
    });
    if (!existing) {
      throw new NotFoundException("CHANNEL_ACCOUNT_NOT_FOUND");
    }

    const nextMeta = {
      ...(existing.meta && typeof existing.meta === "object" && !Array.isArray(existing.meta)
        ? (existing.meta as Record<string, unknown>)
        : {}),
      ...(dto.meta ?? {}),
    };

    const account = await this.prisma.channelAccount.update({
      where: { id: accountId },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.credentials ? { credentialCiphertext: encryptCredentials(dto.credentials) } : {}),
        ...(dto.meta ? { meta: nextMeta as Prisma.InputJsonValue } : {}),
      },
    });

    return {
      id: account.id,
      platform: account.platform,
      name: account.name,
      status: account.status,
      meta: account.meta ?? {},
      credential: this.buildCredentialSummary(account.credentialCiphertext),
    };
  }

  async remove(userId: string, accountId: string) {
    const existing = await this.prisma.channelAccount.findFirst({
      where: { id: accountId, userId },
      select: { id: true, name: true },
    });
    if (!existing) {
      throw new NotFoundException("CHANNEL_ACCOUNT_NOT_FOUND");
    }

    await this.prisma.channelAccount.delete({
      where: { id: accountId },
    });

    return {
      id: existing.id,
      deleted: true,
      name: existing.name,
    };
  }

  private buildCredentialSummary(credentialCiphertext: string | null) {
    const credential = decryptCredentials(credentialCiphertext);
    return {
      configured: Boolean(credential?.appId && credential?.appSecret),
      appIdMasked: maskSecret(credential?.appId),
      appSecretMasked: maskSecret(credential?.appSecret),
    };
  }

  private async ensureUser(userId: string): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        name: "Local User",
      },
    });
  }
}
