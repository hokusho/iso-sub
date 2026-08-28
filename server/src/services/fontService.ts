import path from 'path';
import fs from 'fs';
import https from 'https';

export const FONTS_DIR = path.resolve(__dirname, '../../fonts');

interface FontDownloadTarget {
  filename: string;
  url: string;
}

const STATIC_FONTS: FontDownloadTarget[] = [
  // Montserrat
  { filename: 'Montserrat-Regular.ttf', url: 'https://raw.githubusercontent.com/JulietaUla/Montserrat/master/fonts/ttf/Montserrat-Regular.ttf' },
  { filename: 'Montserrat-Bold.ttf', url: 'https://raw.githubusercontent.com/JulietaUla/Montserrat/master/fonts/ttf/Montserrat-Bold.ttf' },
  { filename: 'Montserrat-ExtraBold.ttf', url: 'https://raw.githubusercontent.com/JulietaUla/Montserrat/master/fonts/ttf/Montserrat-ExtraBold.ttf' },
  { filename: 'Montserrat-Black.ttf', url: 'https://raw.githubusercontent.com/JulietaUla/Montserrat/master/fonts/ttf/Montserrat-Black.ttf' },
  { filename: 'Montserrat.ttf', url: 'https://raw.githubusercontent.com/JulietaUla/Montserrat/master/fonts/ttf/Montserrat-ExtraBold.ttf' },

  // Anton
  { filename: 'Anton.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/anton/Anton-Regular.ttf' },
  { filename: 'Anton-Regular.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/anton/Anton-Regular.ttf' },

  // Bebas Neue
  { filename: 'BebasNeue.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/bebasneue/BebasNeue-Regular.ttf' },
  { filename: 'BebasNeue-Regular.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/bebasneue/BebasNeue-Regular.ttf' },

  // Poppins
  { filename: 'Poppins-Bold.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Bold.ttf' },
  { filename: 'Poppins-ExtraBold.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-ExtraBold.ttf' },
  { filename: 'Poppins-Black.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Black.ttf' },
  { filename: 'Poppins.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-ExtraBold.ttf' },

  // Inter
  { filename: 'Inter-Bold.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/inter/static/Inter-Bold.ttf' },
  { filename: 'Inter-ExtraBold.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/inter/static/Inter-ExtraBold.ttf' },
  { filename: 'Inter-Black.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/inter/static/Inter-Black.ttf' },
  { filename: 'Inter.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/inter/static/Inter-ExtraBold.ttf' },

  // Oswald
  { filename: 'Oswald-Bold.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/oswald/static/Oswald-Bold.ttf' },
  { filename: 'Oswald-ExtraBold.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/oswald/static/Oswald-ExtraBold.ttf' },
  { filename: 'Oswald.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/oswald/static/Oswald-Bold.ttf' },

  // Rubik
  { filename: 'Rubik-Bold.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/rubik/static/Rubik-Bold.ttf' },
  { filename: 'Rubik-ExtraBold.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/rubik/static/Rubik-ExtraBold.ttf' },
  { filename: 'Rubik-Black.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/rubik/static/Rubik-Black.ttf' },
  { filename: 'Rubik.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/rubik/static/Rubik-ExtraBold.ttf' },

  // Syne
  { filename: 'Syne-Bold.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/syne/static/Syne-Bold.ttf' },
  { filename: 'Syne-ExtraBold.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/syne/static/Syne-ExtraBold.ttf' },
  { filename: 'Syne.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/syne/static/Syne-ExtraBold.ttf' },

  // Archivo Black
  { filename: 'ArchivoBlack-Regular.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/archivoblack/ArchivoBlack-Regular.ttf' },
  { filename: 'ArchivoBlack.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/archivoblack/ArchivoBlack-Regular.ttf' },

  // Roboto
  { filename: 'Roboto-Bold.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/src/apache/roboto/static/Roboto-Bold.ttf' },
  { filename: 'Roboto-Black.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/src/apache/roboto/static/Roboto-Black.ttf' },
  { filename: 'Roboto.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/src/apache/roboto/static/Roboto-Bold.ttf' }
];

function fetchBuffer(url: string): Promise<Buffer | null> {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        if (res.headers.location) {
          return fetchBuffer(res.headers.location).then(resolve);
        }
      }
      if (res.statusCode === 200) {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      } else {
        resolve(null);
      }
    }).on('error', () => resolve(null));
  });
}

export async function ensureFontsDownloaded(): Promise<void> {
  if (!fs.existsSync(FONTS_DIR)) {
    fs.mkdirSync(FONTS_DIR, { recursive: true });
  }

  for (const item of STATIC_FONTS) {
    const dest = path.join(FONTS_DIR, item.filename);
    if (!fs.existsSync(dest) || fs.statSync(dest).size < 1000) {
      try {
        const buf = await fetchBuffer(item.url);
        if (buf && buf.length > 1000) {
          fs.writeFileSync(dest, buf);
          console.log(`[FontService] Downloaded font: ${item.filename} (${buf.length} bytes)`);
        }
      } catch (err: any) {
        console.warn(`[FontService] Failed to download font ${item.filename}:`, err.message);
      }
    }
  }
}
