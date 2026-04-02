import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { ContentSourceType } from "@prisma/client";

import { CreateContentVersionDto } from "./dto/create-content-version.dto";
import { ImportMarkdownDto } from "./dto/import-markdown.dto";
import { ListContentQueryDto } from "./dto/list-content.query.dto";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  async importMarkdown(userId: string, dto: ImportMarkdownDto) {
    await this.ensureUser(userId);
    const slug = dto.slug ?? this.slugify(dto.title);

    const existing = await this.prisma.contentItem.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException("SLUG_CONFLICT");
    }

    const content = await this.prisma.contentItem.create({
      data: {
        userId,
        title: dto.title,
        summary: dto.summary,
        slug,
        sourceType: this.toPrismaSourceType(dto.sourceType),
        canonicalUrl: dto.canonicalUrl ?? undefined,
        tags: dto.tags ?? [],
        versions: {
          create: {
            versionNo: 1,
            title: dto.title,
            summary: dto.summary,
            markdownBody: dto.markdownBody,
          },
        },
      },
      include: {
        versions: {
          orderBy: { versionNo: "desc" },
          take: 1,
        },
      },
    });

    return {
      contentId: content.id,
      versionId: content.versions[0]?.id,
      status: content.status,
      slug,
    };
  }

  async list(userId: string, query: ListContentQueryDto) {
    const where = {
      userId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.tag ? { tags: { has: query.tag } } : {}),
      ...(query.keyword
        ? {
            OR: [
              { title: { contains: query.keyword, mode: "insensitive" as const } },
              { summary: { contains: query.keyword, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.contentItem.count({ where }),
      this.prisma.contentItem.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: {
          versions: {
            orderBy: { versionNo: "desc" },
            take: 1,
          },
        },
      }),
    ]);

    return {
      items: rows.map((item) => ({
        id: item.id,
        title: item.title,
        summary: item.summary ?? undefined,
        status: item.status,
        slug: item.slug,
        updatedAt: item.updatedAt.toISOString(),
        latestVersionNo: item.versions[0]?.versionNo ?? 1,
        tags: item.tags,
      })),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  async getById(userId: string, contentId: string) {
    const item = await this.prisma.contentItem.findFirst({
      where: { id: contentId, userId },
      include: {
        versions: { orderBy: { versionNo: "desc" }, take: 20 },
        drafts: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { channelAccount: { select: { name: true, platform: true } } },
        },
      },
    });
    if (!item) {
      throw new NotFoundException("CONTENT_NOT_FOUND");
    }

    const latest = item.versions[0];
    return {
      id: item.id,
      title: item.title,
      summary: item.summary ?? undefined,
      status: item.status,
      slug: item.slug,
      sourceType: item.sourceType,
      tags: item.tags,
      latestVersion: latest
        ? {
            id: latest.id,
            versionNo: latest.versionNo,
            title: latest.title,
            summary: latest.summary ?? undefined,
            markdownBody: latest.markdownBody,
            createdAt: latest.createdAt.toISOString(),
          }
        : null,
      versions: item.versions.map((version) => ({
        id: version.id,
        versionNo: version.versionNo,
        title: version.title,
        summary: version.summary ?? undefined,
        markdownBody: version.markdownBody,
        createdAt: version.createdAt.toISOString(),
      })),
      drafts: item.drafts.map((draft) => ({
        id: draft.id,
        status: draft.status,
        platformDraftId: draft.platformDraftId,
        channelAccountName: draft.channelAccount.name,
        platform: draft.channelAccount.platform,
        createdAt: draft.createdAt.toISOString(),
      })),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  async addVersion(userId: string, contentId: string, dto: CreateContentVersionDto) {
    const item = await this.prisma.contentItem.findFirst({
      where: { id: contentId, userId },
      select: {
        id: true,
        versions: {
          select: { versionNo: true },
          orderBy: { versionNo: "desc" },
          take: 1,
        },
      },
    });
    if (!item) {
      throw new NotFoundException("CONTENT_NOT_FOUND");
    }

    const versionNo = (item.versions[0]?.versionNo ?? 0) + 1;
    const created = await this.prisma.contentVersion.create({
      data: {
        contentItemId: contentId,
        versionNo,
        title: dto.title,
        summary: dto.summary,
        markdownBody: dto.markdownBody,
        changeSummary: dto.changeSummary,
      },
    });
    await this.prisma.contentItem.update({
      where: { id: contentId },
      data: {
        title: dto.title,
        summary: dto.summary,
      },
    });

    return {
      contentId,
      versionId: created.id,
      versionNo,
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

  private toPrismaSourceType(input: string): ContentSourceType {
    if (input === "MANUAL") {
      return ContentSourceType.MANUAL;
    }
    return ContentSourceType.MARKDOWN;
  }

  private slugify(input: string): string {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "untitled";
  }
}

