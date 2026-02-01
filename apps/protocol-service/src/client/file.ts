import { getMimeType } from 'hono/utils/mime';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { basename } from 'node:path';
import { Readable } from 'node:stream';

export class File {
  hash: string;
  size: number = 0;
  type: string;
  preview: string;
  fileName: string;

  constructor(public readonly path: string, text = false) {
    this.hash = createHash('sha256').update(path).digest('hex');

    if (text) {
      this.type = 'text/plain';
      this.fileName = crypto.randomUUID();
      this.preview = path;
      this.size = Buffer.from(path).byteLength;
    } else {
      this.fileName = basename(path);
      this.type = getMimeType(path) || 'application/octet-stream';
      this.size = fs.statSync(path).size;
      this.preview = '';
    }
  }

  toReadableStream() {
    if (this.preview) {
      return Readable.toWeb(Readable.from([this.preview]));
    }
    
    // Use larger buffer (10MB) to improve transfer speed
    return Readable.toWeb(fs.createReadStream(this.path, {
      highWaterMark: 10 * 1024 * 1024 // 10MB
    }));
  }

  toJSON() {
    return {
      id: this.hash,
      fileName: this.fileName,
      size: this.size,
      fileType: this.type,
      preview: this.preview || void 0
    };
  }
}
