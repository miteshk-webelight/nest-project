import { Module } from "@nestjs/common";

import { DownloadModule } from "./download/download.module";
import { MultipartModule } from "./multipart/multipart.module";
import { PreSignedModule } from "./presigned/presigned.module";

@Module({
  imports: [MultipartModule, PreSignedModule, DownloadModule],
})
export class FileManagementModule {}
