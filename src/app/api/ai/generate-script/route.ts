import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { GoogleGenAI } from '@google/genai';

// Clean all markdown symbols (**, *, ###, backticks) to provide clean readable plain text
function cleanPlainText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/___([^_]+)___/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '• ')
    .replace(/```[a-zA-Z]*\n?/g, '')
    .replace(/```/g, '')
    .replace(/`/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .trim();
}

function formatToString(val: any): string {
  if (val === null || val === undefined) return '';
  let str = '';
  if (typeof val === 'string') {
    str = val;
  } else if (Array.isArray(val)) {
    str = val.map((item) => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object') {
        const parts = Object.entries(item).map(([k, v]) => `${k}: ${v}`);
        return parts.join(' - ');
      }
      return String(item);
    }).join('\n\n');
  } else if (typeof val === 'object') {
    str = Object.entries(val).map(([k, v]) => `${k}: ${v}`).join('\n');
  } else {
    str = String(val);
  }

  return cleanPlainText(str);
}

export async function POST(req: Request) {
  try {
    const { title, platform, format, pillar, funnel, objective, prompt, brand_id, user_id } = await req.json();

    const org = dbStore.getOrganizations()[0];
    const settings = dbStore.getGeminiSettings(org?.id);
    const apiKey = settings?.api_key_encrypted || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      dbStore.logAIUsage({
        id: 'log-' + Date.now(),
        brand_id: brand_id || null,
        user_id: user_id || null,
        feature_source: 'socilift_ai_modal',
        model_name: settings?.selected_model || 'gemini-2.5-flash',
        request_type: 'generate_script',
        status: 'failed',
        error_code: 'NO_API_KEY',
        error_message: 'Gemini API Key belum dikonfigurasi.',
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({
        error: 'Gemini API key belum dikonfigurasi. Silakan atur API key di menu Pengaturan.',
        code: 'NO_API_KEY',
      }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const primaryModel = settings?.selected_model || 'gemini-2.5-flash';

    // Get Brand Context if available
    const brand = brand_id ? dbStore.getBrand(brand_id) : null;
    const brandContext = brand ? `
Konteks Brand:
- Nama Brand: ${brand.name}
- Niche: ${brand.details?.niche || '-'}
- Target Audience: ${brand.details?.targetAudience || '-'}
- Tone of Voice: ${brand.details?.toneOfVoice || '-'}
- Nilai Unik (USP): ${brand.details?.usp || '-'}
- Penawaran Utama: ${brand.details?.mainOffer || '-'}
` : '';

    const systemPrompt = `Kamu adalah AI Creative Copywriter & Social Media Strategist untuk Socilift.
Buatkan konten media sosial dalam Bahasa Indonesia dengan format JSON murni tanpa markdown triple backticks.

${brandContext}

Data Input Konten:
- Judul/Topik: ${title || 'Ide Konten'}
- Platform: ${platform || 'TikTok'}
- Format: ${format || 'Video'}
- Pilar Konten: ${pillar || 'Edukasi'}
- Funnel: ${funnel || 'TOFU'}
- Objective: ${objective || 'Engagement'}
- Arahan Tambahan: ${prompt || '-'}

ATURAN PENULISAN SANGAT PENTING:
1. Tulis HANYA dalam teks biasa (plain text) yang bersih, alami, dan siap dibaca talent/creator.
2. DILARANG KERAS menggunakan simbol markdown formatting seperti tanda bintang ganda (**teks**), bintang tunggal (*teks*), tanda pagar (###), atau format kode markdown lainnya.
3. Untuk pemisah poin atau daftar, gunakan penomoran biasa (1, 2, 3) atau tanda strip (-).

Instruksi Output:
Kembalikan respon dalam format JSON objek murni dengan 7 kunci teks (string) berikut:
{
  "hook": "Teks Hook pembuka 3 detik pertama yang sangat memikat rasa penasaran audiens (teks bersih tanpa simbol bintang **)",
  "hook_visual": "Arahan visual kamera, ekspresi talent, atau grafis pembuka (teks bersih tanpa simbol bintang **)",
  "script": "Naskah narasi lengkap atau poin-poin naskah inti yang dibawakan (teks bersih tanpa simbol bintang **)",
  "body_visual": "Arahan visual b-roll, screen record, transisi editing, atau infografis (teks bersih tanpa simbol bintang **)",
  "cta": "Teks ajakan aksi yang spesifik (komen, save, follow, klik link)",
  "cta_visual": "Arahan visual teks call to action atau gerakan menunjuk di layar",
  "caption": "Teks caption lengkap yang menarik beserta 5-8 hashtag yang relevan (teks bersih tanpa simbol bintang **)"
}`;

    // Try primary model, fallback to gemini-2.5-flash-lite or gemini-flash-latest on high load/503/404
    const candidateModels = [primaryModel, 'gemini-2.5-flash-lite', 'gemini-flash-latest', 'gemini-2.5-flash'];
    const uniqueModels = Array.from(new Set(candidateModels));
    let responseText = '';
    let usedModel = primaryModel;
    let lastError: any = null;

    for (const modelToTry of uniqueModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelToTry,
          contents: systemPrompt,
        });
        if (response.text) {
          responseText = response.text;
          usedModel = modelToTry;
          break;
        }
      } catch (err: any) {
        lastError = err;
        // Continue to fallback model if 503, 429, or 404
      }
    }

    if (!responseText) {
      dbStore.logAIUsage({
        id: 'log-' + Date.now(),
        brand_id: brand_id || null,
        user_id: user_id || null,
        feature_source: 'socilift_ai_modal',
        model_name: primaryModel,
        request_type: 'generate_script',
        status: 'failed',
        error_code: 'GEMINI_ERROR',
        error_message: lastError?.message || 'Gagal menghubungi model AI.',
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({
        error: `Gagal memanggil Gemini API: ${lastError?.message || 'Layanan sedang sibuk, silakan coba lagi.'}`,
        code: 'GEMINI_ERROR',
      }, { status: 500 });
    }

    let cleanJson = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
    let parsed: any;
    try {
      parsed = JSON.parse(cleanJson);
    } catch {
      parsed = {
        hook: responseText.slice(0, 100),
        hook_visual: 'Ekspresi antusias di depan kamera',
        script: responseText,
        body_visual: 'B-roll footage dinamis',
        cta: 'Follow dan bookmark konten ini untuk tips berikutnya!',
        cta_visual: 'Teks call to action beranimasi di layar',
        caption: responseText.slice(0, 150) + ' #tipscreator #kontenkeren #viral',
      };
    }

    // Ensure all fields are formatted as clean plain strings without ** or markdown
    const formattedResult = {
      hook: formatToString(parsed.hook),
      hook_visual: formatToString(parsed.hook_visual),
      script: formatToString(parsed.script),
      body_visual: formatToString(parsed.body_visual),
      cta: formatToString(parsed.cta),
      cta_visual: formatToString(parsed.cta_visual),
      caption: formatToString(parsed.caption),
    };

    dbStore.logAIUsage({
      id: 'log-' + Date.now(),
      brand_id: brand_id || null,
      user_id: user_id || null,
      feature_source: 'socilift_ai_modal',
      model_name: usedModel,
      request_type: 'generate_script',
      status: 'success',
      input_tokens: 150,
      output_tokens: 300,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, result: formattedResult });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
