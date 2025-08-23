import { storage } from '../config/firebase';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
    success: boolean;
    url?: string;
    error?: string;
}

export class StorageService {
    private bucket = storage.bucket();

    async uploadFile(file: Express.Multer.File, folder: string = 'uploads'): Promise<UploadResult> {
        try {
            const fileName = `${folder}/${uuidv4()}-${file.originalname}`;
            const fileBuffer = file.buffer;
            const fileUpload = this.bucket.file(fileName);

            const stream = fileUpload.createWriteStream({
                metadata: {
                    contentType: file.mimetype,
                },
            });

            return new Promise((resolve, reject) => {
                stream.on('error', (error) => {
                    resolve({ success: false, error: error.message });
                });

                stream.on('finish', async () => {
                    await fileUpload.makePublic();
                    const url = `https://storage.googleapis.com/${this.bucket.name}/${fileName}`;
                    resolve({ success: true, url });
                });

                stream.end(fileBuffer);
            });
        } catch (error) {
            return { success: false, error: 'File upload failed' };
        }
    }

    async deleteFile(fileUrl: string): Promise<boolean> {
        try {
            const fileName = fileUrl.split('/').pop();
            if (!fileName) return false;

            await this.bucket.file(fileName).delete();
            return true;
        } catch (error) {
            console.error('File deletion failed:', error);
            return false;
        }
    }

    async getSignedUrl(fileName: string, action: 'read' | 'write' = 'read', expiresIn: number = 3600): Promise<string | null> {
        try {
            const file = this.bucket.file(fileName);
            const [url] = await file.getSignedUrl({
                action,
                expires: Date.now() + expiresIn * 1000,
            });
            return url;
        } catch (error) {
            console.error('Signed URL generation failed:', error);
            return null;
        }
    }

    async listFiles(folder: string = ''): Promise<string[]> {
        try {
            const [files] = await this.bucket.getFiles({ prefix: folder });
            return files.map(file => file.name);
        } catch (error) {
            console.error('File listing failed:', error);
            return [];
        }
    }
}

export const storageService = new StorageService();
