import type { Announcement } from "@localsend/common/type";

export type PrepareUploadFile = {
  id: string;
  fileName: string;
  size: number;
  fileType: string;
  sha256?: string;
  preview?: string;
  metadata?: {
    modified?: string;
    accessed?: string;
  };
};

export type PrepareUploadRequestBody = {
  info: Announcement;
  files: Record<string, PrepareUploadFile>;
};

export type PrepareUploadResponseBody = {
  sessionId: string;
  files: Record<string, string>;
};
