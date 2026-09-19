import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { GoogleGenAI } from '@google/genai';
import { AIChatMessage } from '@/types/database';

export async function GET(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params;
    const messages = dbStore.getChatMessages(sessionId);
    return NextResponse.json({ messages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params;
    const { message, brand_id, user_id } = await req.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Pesan tidak boleh kosong' }, { status: 400 });
    }

    const session = dbStore.getChatSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session tidak ditemukan' }, { status: 404 });
    }

    // 1. Record User Message
    const userMsg: AIChatMessage = {
      id: 'msg-' + Date.now(),
      session_id: sessionId,
      brand_id: brand_id || session.brand_id,
      role: 'user',
      message_text: message.trim(),
      message_type: 'text',
      created_at: new Date().toISOString(),
    };
    dbStore.addChatMessage(userMsg);

    // 2. Check API Key
    const org = dbStore.getOrganizations()[0];
    const settings = dbStore.getGeminiSettings(org?.id);
    const apiKey = settings?.api_key_encrypted || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      dbStore.logAIUsage({
        id: 'log-' + Date.now(),
        brand_id: brand_id || session.brand_id,
        user_id: user_id || null,
        feature_source: 'socilift_ai_chat',
        model_name: settings?.selected_model || 'gemini-2.5-flash',
        request_type: 'chat_message',
        status: 'failed',
        error_code: 'NO_API_KEY',
        error_message: 'Gemini API Key belum dikonfigurasi.',
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({
        error: 'Gemini API Key belum terhubung. Silakan konfigurasi API Key di menu Pengaturan.',
        code: 'NO_API_KEY',
        userMessage: userMsg,
      }, { status: 400 });
    }

    // 3. Call Gemini
    const ai = new GoogleGenAI({ apiKey });
    const model = settings?.selected_model || 'gemini-2.5-flash';

    const brand = dbStore.getBrand(brand_id || session.brand_id);
    const brandContext = brand ? `
PROFIL BRAND LENGKAP:
- Nama Brand: ${brand.name}
- Niche & Industri: ${brand.details?.niche || '-'}
- Deskripsi Produk / Layanan: ${brand.details?.productServiceDesc || '-'}
- Target Audience: ${brand.details?.targetAudience || '-'}
- Brand Positioning: ${brand.details?.brandPositioning || '-'}
- Tone of Voice: ${brand.details?.toneOfVoice || '-'}
- Penawaran Utama (Main Offer): ${brand.details?.mainOffer || '-'}
- Unique Selling Point (USP): ${brand.details?.usp || '-'}
- Pilar Konten: ${brand.pillars?.join(', ') || '-'}
- Funnel Fokus: ${brand.funnels?.join(', ') || '-'}
- Tujuan Utama: ${brand.objectives?.join(', ') || '-'}
` : '';

    const systemInstruction = `Kamu adalah Socilift AI Assistant — pakar strategi konten, copywriter viral, dan konsultan pertumbuhan media sosial berkelas dunia.
Tugasmu adalah membantu pengguna menyusun ide konten berbobot, hook berdaya konversi tinggi, naskah video/carousel, dan strategi pertumbuhan media sosial.

PANDUAN RESPONS:
1. Selalu selaraskan jawaban dengan Profil Brand di bawah (Niche, Target Audience, Tone of Voice, dan USP).
2. Gunakan Bahasa Indonesia yang natural, energik, praktis, dan langsung dapat dieksekusi.
3. Saat memberikan rekomendasi ide konten, cantumkan komponen terstruktur:
   - **Judul Konten**: (Singkat & menarik)
   - **Platform & Format**: (misal TikTok Video, Instagram Carousel)
   - **Hook 3 Detik Pertama**: (Kuat & menghentikan scroll)
   - **Inti Naskah / Alur Script**: (Poin-poin visual & verbal)
   - **Call to Action (CTA)**: (Jelas & terarah)

${brandContext}`;

    const history = dbStore.getChatMessages(sessionId);
    const contents = [
      {
        role: 'user',
        parts: [{ text: systemInstruction }]
      },
      {
        role: 'model',
        parts: [{ text: 'Siap! Saya memahami seluruh profil brand, target audiens, pilar konten, dan tone of voice. Saya siap membantu menyusun strategi dan naskah konten viral berdaya konversi tinggi.' }]
      },
      ...history.slice(-8).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.message_text }],
      })),
    ];

    try {
      const chatResponse = await ai.models.generateContent({
        model,
        contents: contents as any,
      });

      const replyText = chatResponse.text || 'Maaf, tidak ada respon yang dapat dihasilkan.';

      const assistantMsg: AIChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        session_id: sessionId,
        brand_id: brand_id || session.brand_id,
        role: 'assistant',
        message_text: replyText,
        message_type: 'text',
        created_at: new Date().toISOString(),
      };
      dbStore.addChatMessage(assistantMsg);

      dbStore.logAIUsage({
        id: 'log-' + Date.now(),
        brand_id: brand_id || session.brand_id,
        user_id: user_id || null,
        feature_source: 'socilift_ai_chat',
        model_name: model,
        request_type: 'chat_message',
        status: 'success',
        input_tokens: 200,
        output_tokens: 450,
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        userMessage: userMsg,
        assistantMessage: assistantMsg,
      });
    } catch (apiError: any) {
      dbStore.logAIUsage({
        id: 'log-' + Date.now(),
        brand_id: brand_id || session.brand_id,
        user_id: user_id || null,
        feature_source: 'socilift_ai_chat',
        model_name: model,
        request_type: 'chat_message',
        status: 'failed',
        error_code: 'GEMINI_ERROR',
        error_message: apiError.message,
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({
        error: `Gagal memanggil Gemini API: ${apiError.message}`,
        code: 'GEMINI_ERROR',
        userMessage: userMsg,
      }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
