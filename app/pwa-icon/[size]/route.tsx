import { readFile } from 'fs/promises';
import path from 'path';
import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';

export async function GET(_: Request, { params }: { params: { size: string } }) {
  const requested = Number(params.size);
  const size = requested >= 512 ? 512 : requested >= 192 ? 192 : 180;
  const filePath = path.join(process.cwd(), 'public', 'miku.png');
  const file = await readFile(filePath);
  const src = `data:image/png;base64,${file.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #dffbf6 0%, #b7efe6 100%)',
          borderRadius: 96,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at top left, rgba(57,197,187,0.25), transparent 35%), radial-gradient(circle at bottom right, rgba(56,189,248,0.18), transparent 30%)'
          }}
        />
        <img
          src={src}
          alt="MikuBlob icon"
          width={Math.round(size * 0.82)}
          height={Math.round(size * 0.82)}
          style={{
            objectFit: 'contain',
            position: 'relative'
          }}
        />
      </div>
    ),
    {
      width: size,
      height: size
    }
  );
}
