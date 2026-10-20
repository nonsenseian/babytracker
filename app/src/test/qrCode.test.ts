import { describe, it, expect } from 'vitest';
import QRCode from 'qrcode';
import jsQR from 'jsqr';

describe('Couples & Care Partners QR Code Generator', () => {
    it('generates an ISO-compliant, scannable QR code that decodes to the exact room invite URL', async () => {
        const roomId = 'ROOM_TEST_8821';
        const inviteUrl = `https://babytracker.app/?room=${roomId}`;

        // 1. Generate QR matrix via qrcode engine
        const qr = QRCode.create(inviteUrl, { errorCorrectionLevel: 'M' });
        const modSize = qr.modules.size;
        const margin = 4;
        const scale = 4;
        const width = (modSize + margin * 2) * scale;
        const pixelData = new Uint8ClampedArray(width * width * 4);
        pixelData.fill(255); // White background

        for (let r = 0; r < modSize; r++) {
            for (let c = 0; c < modSize; c++) {
                if (qr.modules.get(r, c)) {
                    for (let dy = 0; dy < scale; dy++) {
                        for (let dx = 0; dx < scale; dx++) {
                            const y = (r + margin) * scale + dy;
                            const x = (c + margin) * scale + dx;
                            const idx = (y * width + x) * 4;
                            pixelData[idx] = 0;
                            pixelData[idx + 1] = 0;
                            pixelData[idx + 2] = 0;
                            pixelData[idx + 3] = 255;
                        }
                    }
                }
            }
        }

        // 2. Decode using optical scanner engine jsQR
        const decoded = jsQR(pixelData, width, width);
        expect(decoded).not.toBeNull();
        expect(decoded?.data).toBe(inviteUrl);
    });

    it('generates a valid data:image/png URL via QRCode.toDataURL', async () => {
        const url = 'https://babytracker.app/?room=FAMILY_TEST';
        const dataUrl = await QRCode.toDataURL(url, { margin: 2, width: 200 });
        expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);
        expect(dataUrl.length).toBeGreaterThan(500);
    });
});
