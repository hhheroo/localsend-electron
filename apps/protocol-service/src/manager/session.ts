import type {
  PrepareUploadFile,
  PrepareUploadRequestBody,
} from '../server/routes/prepare-upload.type';
import { createHmac } from 'node:crypto';
import { EventEmitter } from 'node:events';

export type Session = {
  id: string;
  req: PrepareUploadRequestBody;
  fileTokens: Record<string, string>;
};

export interface SessionManagerEvents {
  'session-created': (session: Session) => void;
  'session-removed': (sessionId: string) => void;
  'file-uploaded': (sessionId: string, fileId: string) => void;
}

export class SessionManager extends EventEmitter {
  private sessions: Record<string, Session | null> = {};

  // Type-safe event methods
  override on<K extends keyof SessionManagerEvents>(
    event: K,
    listener: SessionManagerEvents[K]
  ): this {
    return super.on(event, listener);
  }

  override emit<K extends keyof SessionManagerEvents>(
    event: K,
    ...args: Parameters<SessionManagerEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }

  createSession(req: PrepareUploadRequestBody) {
    const sessionId = crypto.randomUUID();
    const session: Session = { id: sessionId, req, fileTokens: {} };

    Object.values(req.files).forEach(file => {
      session.fileTokens[file.id] = this.crateTokenForFile(sessionId, file);
    });

    this.sessions[sessionId] = session;

    // Emit event: new upload request
    this.emit('session-created', session);

    return session;
  }

  crateTokenForFile(sessionId: string, file: PrepareUploadFile) {
    return createHmac('sha256', sessionId).update(file.id).digest('hex');
  }

  getSession(sessionId?: string) {
    return sessionId ? this.sessions[sessionId] : null;
  }

  removeSession(sessionId: string) {
    if (!Object.hasOwn(this.sessions, sessionId)) return;
    this.sessions[sessionId] = null;
    // Emit event: session removed
    this.emit('session-removed', sessionId);
  }

  // Mark file upload as complete
  markFileUploaded(sessionId: string, fileId: string) {
    this.emit('file-uploaded', sessionId, fileId);
  }
}

export const sessionManager = new SessionManager();
