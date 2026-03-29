import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { DraftStatus, Prisma, PublishJobStatus } from "@prisma/client";

import { decryptCredentials } from "../../common/security/credential-crypto";
import { CreateDraftDto } from "./dto/create-draft.dto";
import { ListDraftsQueryDto } from "./dto/list-drafts.query.dto";
import { PrismaService } from "../prisma/prisma.service";
import { ThemesService } from "../themes/themes.service";
import { DraftPublisherAdapter } from "./adapters/draft-publisher.adapter";
import { DRAFT_PUBLISHER_ADAPTER } from "./adapters/draft-publisher.token";

@Injectable()
export class DraftsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly themesService: ThemesService,
    @Inject(DRAFT_PUBLISHER_ADAPTER)
    private readonly draftPublisherAdapter: DraftPublisherAdapter,
  ) {}

  async create(userId: string, dto: CreateDraftDto) {
    const [content, version, account, theme] = await Promise.all([
      this.prisma.contentItem.findFirst({
        where: { id: dto.contentId, userId },
        select: { id: true },
      }),
      this.prisma.contentVersion.findUnique({
        where: { id: dto.versionId },
        select: { id: true, contentItemId: true, title: true, markdownBody: true },
      }),
      this.prisma.channelAccount.findFirst({
        where: { id: dto.channelAccountId, userId },
        select: { id: true, platform: true, credentialCiphertext: true, meta: true },
      }),
      this.prisma.theme.findUnique({
        where: { code: dto.themeCode },
        select: { id: true, targetPlatform: true },
      }),
    ]);

    if (!content) {
      throw new NotFoundException("CONTENT_NOT_FOUND");
    }
    if (!version || version.contentItemId !== dto.contentId) {
      throw new NotFoundException("CONTENT_VERSION_NOT_FOUND");
    }
    if (!account) {
      throw new NotFoundException("CHANNEL_ACCOUNT_NOT_FOUND");
    }
    if (!theme) {
      throw new NotFoundException("THEME_NOT_FOUND");
    }
    if (account.platform !== dto.platform) {
      throw new NotFoundException("UNSUPPORTED_CAPABILITY");
    }
    if (theme.targetPlatform !== dto.platform) {
      throw new NotFoundException("THEME_PLATFORM_MISMATCH");
    }

    const job = await this.prisma.publishJob.create({
      data: {
        contentItemId: dto.contentId,
        channelAccountId: dto.channelAccountId,
        status: PublishJobStatus.RENDERING,
        startedAt: new Date(),
        attemptCount: 1,
      },
    });

    try {
      const preview = await this.themesService.renderPreview({
        themeCode: dto.themeCode,
        platform: dto.platform,
        markdownBody: version.markdownBody,
        title: version.title,
      });

      if (!this.draftPublisherAdapter.supports(dto.platform)) {
        throw new NotFoundException("UNSUPPORTED_CAPABILITY");
      }

      const publishResult = await this.draftPublisherAdapter.createDraft({
        publishJobId: job.id,
        platform: dto.platform,
        contentId: dto.contentId,
        versionId: dto.versionId,
        channelAccountId: dto.channelAccountId,
        channelCredentials: this.parseChannelCredentials(account.credentialCiphertext, account.meta),
        themeCode: dto.themeCode,
        title: version.title,
        markdownBody: version.markdownBody,
        renderedHtml: preview.html,
      });

      await this.prisma.draftRecord.create({
        data: {
          contentItemId: dto.contentId,
          channelAccountId: dto.channelAccountId,
          themeId: theme.id,
          status: DraftStatus.CREATED,
          platformDraftId: publishResult.platformDraftId,
          previewUrl: publishResult.previewUrl,
          renderedHtml: preview.html,
          platformPayload: {
            publishJobId: job.id,
            provider: publishResult.provider,
            contentId: dto.contentId,
            versionId: dto.versionId,
            channelAccountId: dto.channelAccountId,
            themeCode: dto.themeCode,
            platform: dto.platform,
            ...(publishResult.previewUrl ? { previewUrl: publishResult.previewUrl } : {}),
          } as Prisma.InputJsonValue,
          rawResponse: publishResult.rawResponse as Prisma.InputJsonValue,
        },
      });

      await this.prisma.publishJob.update({
        where: { id: job.id },
        data: {
          status: PublishJobStatus.DRAFTED,
          finishedAt: new Date(),
        },
      });
    } catch (error) {
      await this.prisma.draftRecord.create({
        data: {
          contentItemId: dto.contentId,
          channelAccountId: dto.channelAccountId,
          themeId: theme.id,
          status: DraftStatus.FAILED,
          platformPayload: {
            publishJobId: job.id,
            contentId: dto.contentId,
            versionId: dto.versionId,
            channelAccountId: dto.channelAccountId,
            themeCode: dto.themeCode,
            platform: dto.platform,
          } as Prisma.InputJsonValue,
          errorMessage: error instanceof Error ? error.message : "DRAFT_CREATE_FAILED",
        },
      });

      await this.prisma.publishJob.update({
        where: { id: job.id },
        data: {
          status: PublishJobStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : "DRAFT_CREATE_FAILED",
          finishedAt: new Date(),
        },
      });
      throw error;
    }

    const finalJob = await this.prisma.publishJob.findUnique({
      where: { id: job.id },
      select: { id: true, status: true },
    });

    return {
      publishJobId: finalJob?.id ?? job.id,
      status: finalJob?.status ?? PublishJobStatus.FAILED,
    };
  }

  async retry(userId: string, publishJobId: string) {
    const job = await this.prisma.publishJob.findFirst({
      where: {
        id: publishJobId,
        channelAccount: { userId },
      },
      select: {
        id: true,
        status: true,
      },
    });
    if (!job) {
      throw new NotFoundException("DRAFT_JOB_NOT_FOUND");
    }

    const draftRecord = await this.prisma.draftRecord.findFirst({
      where: {
        platformPayload: {
          path: ["publishJobId"],
          equals: publishJobId,
        },
      },
      orderBy: { createdAt: "desc" },
      select: { platformPayload: true },
    });

    const payload =
      draftRecord?.platformPayload &&
      typeof draftRecord.platformPayload === "object" &&
      !Array.isArray(draftRecord.platformPayload)
        ? (draftRecord.platformPayload as Record<string, unknown>)
        : null;
    const retryDto: CreateDraftDto | null =
      payload &&
      typeof payload.contentId === "string" &&
      typeof payload.versionId === "string" &&
      typeof payload.channelAccountId === "string" &&
      typeof payload.themeCode === "string" &&
      payload.platform === "WECHAT_OFFICIAL"
        ? {
            contentId: payload.contentId,
            versionId: payload.versionId,
            channelAccountId: payload.channelAccountId,
            themeCode: payload.themeCode,
            platform: "WECHAT_OFFICIAL",
          }
        : null;

    if (!retryDto) {
      throw new NotFoundException("RETRY_CONTEXT_NOT_FOUND");
    }

    return this.create(userId, retryDto);
  }

  async list(userId: string, query: ListDraftsQueryDto) {
    const where = {
      channelAccount: { userId },
      ...(query.status ? { status: query.status as PublishJobStatus } : {}),
    };

    const [total, jobs] = await this.prisma.$transaction([
      this.prisma.publishJob.count({ where }),
      this.prisma.publishJob.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: {
          contentItem: { select: { title: true } },
          channelAccount: { select: { name: true, platform: true } },
        },
      }),
    ]);

    return {
      items: jobs.map((job) => ({
        publishJobId: job.id,
        contentId: job.contentItemId,
        contentTitle: job.contentItem.title,
        platform: job.channelAccount.platform,
        channelAccountName: job.channelAccount.name,
        status: job.status,
        createdAt: job.createdAt.toISOString(),
        finishedAt: job.finishedAt?.toISOString() ?? null,
      })),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  async getById(userId: string, publishJobId: string) {
    const job = await this.prisma.publishJob.findFirst({
      where: {
        id: publishJobId,
        channelAccount: { userId },
      },
      include: {
        contentItem: { select: { id: true, title: true } },
        channelAccount: { select: { id: true } },
      },
    });
    if (!job) {
      throw new NotFoundException("DRAFT_JOB_NOT_FOUND");
    }

    const draftRecord = await this.prisma.draftRecord.findFirst({
      where: {
        platformPayload: {
          path: ["publishJobId"],
          equals: publishJobId,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      publishJobId: job.id,
      status: job.status,
      attemptCount: job.attemptCount,
      content: {
        id: job.contentItem.id,
        title: job.contentItem.title,
      },
      draftRecord: {
        id: draftRecord?.id ?? null,
        platformDraftId: draftRecord?.platformDraftId ?? null,
        previewUrl: draftRecord?.previewUrl ?? null,
        errorMessage: draftRecord?.errorMessage ?? job.errorMessage ?? null,
      },
      retryable:
        Boolean(
          draftRecord?.platformPayload &&
            typeof draftRecord.platformPayload === "object" &&
            !Array.isArray(draftRecord.platformPayload) &&
            typeof (draftRecord.platformPayload as Record<string, unknown>).versionId === "string" &&
            typeof (draftRecord.platformPayload as Record<string, unknown>).themeCode === "string",
        ) && job.status === PublishJobStatus.FAILED,
      createdAt: job.createdAt.toISOString(),
      startedAt: job.startedAt?.toISOString() ?? null,
      finishedAt: job.finishedAt?.toISOString() ?? null,
    };
  }

  private parseChannelCredentials(
    credentialCiphertext: string | null,
    meta: Prisma.JsonValue | null,
  ): { appId: string; appSecret: string; author?: string; defaultThumbMediaId?: string } | undefined {
    const json = decryptCredentials(credentialCiphertext) as { appId?: string; appSecret?: string } | undefined;
    if (!json?.appId || !json?.appSecret) {
      return undefined;
    }

    const metaObj = meta && typeof meta === "object" && !Array.isArray(meta) ? meta : null;
    const author =
      metaObj && typeof (metaObj as Record<string, unknown>).author === "string"
        ? ((metaObj as Record<string, unknown>).author as string)
        : undefined;
    const defaultThumbMediaId =
      metaObj && typeof (metaObj as Record<string, unknown>).defaultThumbMediaId === "string"
        ? ((metaObj as Record<string, unknown>).defaultThumbMediaId as string)
        : undefined;

    return {
      appId: json.appId,
      appSecret: json.appSecret,
      author,
      defaultThumbMediaId,
    };
  }
}
