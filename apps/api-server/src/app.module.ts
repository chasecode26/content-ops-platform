import { Module } from "@nestjs/common";

import { ChannelAccountsModule } from "./modules/channel-accounts/channel-accounts.module";
import { ContentModule } from "./modules/content/content.module";
import { DraftsModule } from "./modules/drafts/drafts.module";
import { HealthModule } from "./modules/health/health.module";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { ThemesModule } from "./modules/themes/themes.module";

@Module({
  imports: [PrismaModule, HealthModule, ContentModule, ThemesModule, ChannelAccountsModule, DraftsModule],
})
export class AppModule {}
