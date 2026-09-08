const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 implementation for PNG chunks
function createCrcTable() {
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[n] = c >>> 0;
  }
  return table;
}

const crcTable = createCrcTable();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const typeAndData = Buffer.concat([typeBuf, data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);

  return Buffer.concat([len, typeAndData, crc]);
}

function createPng(size, isMaskable = false) {
  const width = size;
  const height = size;

  // Scanlines with filter byte 0
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(rowLength * height);

  // Colors: Indigo theme #4338ca (67, 56, 202), dark #312e81 (49, 46, 129), white #ffffff
  const center = size / 2;
  const radius = isMaskable ? size * 0.48 : size * 0.44;
  const innerRadius = radius * 0.85;

  for (let y = 0; y < height; y++) {
    const rowStart = y * rowLength;
    rawData[rowStart] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const px = rowStart + 1 + x * 4;
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background color: Deep indigo slate gradient
      const t = y / height;
      const bgR = Math.round(30 + t * 40);
      const bgG = Math.round(27 + t * 45);
      const bgB = Math.round(75 + t * 130);

      let r = bgR;
      let g = bgG;
      let b = bgB;
      let a = 255;

      // Draw warehouse box / emblem
      // Box coordinates
      const boxSize = size * 0.5;
      const left = center - boxSize / 2;
      const right = center + boxSize / 2;
      const top = center - boxSize / 2;
      const bottom = center + boxSize / 2;

      // Outer rounded card
      if (x >= left && x <= right && y >= top && y <= bottom) {
        // Subtle box highlight
        r = 79;
        g = 70;
        b = 229; // Indigo 600

        // Inner warehouse box design: Draw stylized "G" & package flaps
        const cx = x - center;
        const cy = y - center;

        // Draw central stylized package
        const cubeW = boxSize * 0.7;
        const cubeH = boxSize * 0.65;
        if (Math.abs(cx) < cubeW / 2 && Math.abs(cy) < cubeH / 2) {
          r = 255;
          g = 255;
          b = 255;

          // Cutout inside for "G" letter or box line
          if (cy > -cubeH * 0.2 && cy < cubeH * 0.2 && cx > -cubeW * 0.25 && cx < cubeW * 0.25) {
            r = 79;
            g = 70;
            b = 229;
          }
          // Horizontal bar for G
          if (cy >= 0 && cy <= cubeH * 0.2 && cx >= 0 && cx <= cubeW * 0.35) {
            r = 255;
            g = 255;
            b = 255;
          }
        }
      }

      rawData[px] = r;
      rawData[px + 1] = g;
      rawData[px + 2] = b;
      rawData[px + 3] = a;
    }
  }

  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // No interlace

  const idat = zlib.deflateSync(rawData);

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idat),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating PWA icons...');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPng(48, false));

// Also write public/icon.svg
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" rx="128" fill="#4338ca"/>
  <rect x="32" y="32" width="448" height="448" rx="96" fill="url(#grad)" fill-opacity="0.2"/>
  <path d="M128 176C128 158.327 142.327 144 160 144H352C369.673 144 384 158.327 384 176V336C384 353.673 369.673 368 352 368H160C142.327 368 128 353.673 128 336V176Z" fill="white"/>
  <path d="M216 216H296V256H256V296H216V216Z" fill="#4338ca"/>
  <path d="M296 256H336V328H176V328" stroke="#4338ca" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
  <defs>
    <linearGradient id="grad" x1="32" y1="32" x2="480" y2="480" gradientUnits="userSpaceOnUse">
      <stop stop-color="#818cf8"/>
      <stop offset="1" stop-color="#312e81"/>
    </linearGradient>
  </defs>
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);

console.log('All icons generated successfully!');
