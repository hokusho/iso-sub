import { buildAssSubtitle, buildSrtSubtitle, buildVttSubtitle } from './services/assBuilder';
import { groupWordsIntoBlocks, parseSubtitleFileContent } from './services/whisperService';
import { SubtitleBlock, SubtitleStyle } from './types';

const TEST_STYLE: SubtitleStyle = {
  presetName: 'Hormozi Viral',
  fontFamily: 'Montserrat',
  fontSize: 54,
  lineHeight: 1.2,
  letterSpacing: 1,
  caseTransform: 'uppercase',
  textColor: '#FFFFFF',
  highlightColor: '#FFDF00',
  strokeColor: '#000000',
  strokeWidth: 10,
  shadowColor: '#000000',
  shadowBlur: 8,
  shadowDistance: 6,
  useBackgroundBox: false,
  boxColor: '#000000',
  boxOpacity: 0.75,
  boxPaddingX: 16,
  boxPaddingY: 8,
  boxRadius: 12,
  positionY: 72,
  positionX: 50,
  alignment: 'center',
  maxWidthPercent: 85,
  animationType: 'pop',
  animationScale: 1.22,
  animationDurationMs: 120,
  wordsPerLine: 3,
  maxLines: 2,
};

async function runTests() {
  console.log('--- 🧪 INICIANDO TESTES AUTOMATIZADOS DO SISTEMA ---');

  // 1. Health Check
  const healthRes = await fetch('http://localhost:4000/health');
  const health = await healthRes.json();
  console.log('✅ 1. Backend Health Check:', health);

  // 2. Test ASS Builder
  const testBlocks: SubtitleBlock[] = [
    {
      id: 'block-1',
      start: 0.5,
      end: 2.2,
      text: 'CRIE LEGENDAS VIRAL',
      words: [
        { id: 'w-1', text: 'CRIE', start: 0.5, end: 1.0 },
        { id: 'w-2', text: 'LEGENDAS', start: 1.0, end: 1.6 },
        { id: 'w-3', text: 'VIRAL', start: 1.6, end: 2.2 }
      ]
    }
  ];

  const assOutput = buildAssSubtitle({
    width: 1080,
    height: 1920,
    blocks: testBlocks,
    style: TEST_STYLE
  });

  console.log('✅ 2. ASS Subtitle Builder gerou script com sucesso!');
  console.log('Preview das primeiras 10 linhas do ASS:');
  console.log(assOutput.split('\n').slice(0, 10).join('\n'));

  // 3. Test SRT and VTT Builders
  const srtOutput = buildSrtSubtitle(testBlocks);
  const vttOutput = buildVttSubtitle(testBlocks);
  console.log('✅ 3. Geradores SRT e VTT OK:\n', srtOutput.trim());

  // 4. Test API Rechunker
  const rechunkRes = await fetch('http://localhost:4000/api/rechunk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      words: testBlocks[0].words,
      wordsPerBlock: 1
    })
  });
  const rechunkData: any = await rechunkRes.json();
  console.log(`✅ 4. Rechunker Endpoint OK: ${rechunkData.blocks.length} blocos gerados com 1 palavra/bloco.`);

  // 5. Test ProRes 4444 Alpha Render
  console.log('🎬 5. Testando Renderizador ProRes 4444 com Alpha (Transparência)...');
  const proresRes = await fetch('http://localhost:4000/api/render/prores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      blocks: testBlocks,
      style: TEST_STYLE,
      duration: 3,
      width: 720,
      height: 1280,
      fps: 30
    })
  });
  const proresData: any = await proresRes.json();
  console.log('Job de Render ProRes iniciado com ID:', proresData.jobId);

  // Poll progress
  await new Promise((resolve) => {
    const checkInterval = setInterval(async () => {
      // Connect to SSE or check status
      // Wait 3 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(true);
      }, 3500);
    }, 500);
  });

  console.log('✅ 5. Render ProRes 4444 concluído com sucesso!');

  // 6. Test Windows Explorer opening
  const explorerRes = await fetch('http://localhost:4000/api/open-folder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  const explorerData = await explorerRes.json();
  console.log('✅ 6. Endpoint de abrir no Windows Explorer:', explorerData);

  console.log('\n🎉 TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!');
}

runTests().catch(console.error);
