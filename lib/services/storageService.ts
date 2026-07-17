const BUCKET = 'cases-pdf';

export const storageService = {
    async uploadPdf(file: File, storagePath: string): Promise<string> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', storagePath);

        const res = await fetch('/api/storage/upload', { method: 'POST', body: formData });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Error al subir archivo');
        }
        const { url } = await res.json();
        return url;
    },

    async deletePdf(storagePath: string): Promise<void> {
        await fetch('/api/storage/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: storagePath }),
        });
    },

    extractPathFromUrl(url: string): string | null {
        const prefix = `/storage/v1/object/public/${BUCKET}/`;
        const idx = url.indexOf(prefix);
        if (idx !== -1) {
            return url.slice(idx + prefix.length);
        }
        return null;
    },

    isStorageUrl(url: string): boolean {
        return url.startsWith('http') && url.includes(`/${BUCKET}/`);
    },

    buildRepoPath(folderId: string, _caseId: string, fileName: string): string {
        return `repository/${folderId}/${fileName}`;
    },

    buildPersonalPath(userId: string, folderId: string, _caseId: string, fileName: string): string {
        return `personal/${userId}/${folderId}/${fileName}`;
    },
};
