import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { GoogleGenAI } from '@google/genai';

function maskKey(key: string | null | undefined): string {
  if (!key) return '';
  if (key.length <= 8) return '••••••••';
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}

// Normalize model name to current supported models
function normalizeModelName(model?: string | null): string {
  if (!model || model === 'auto' || model === 'gemini-1.5-flash' || model === 'gemini-1.5-pro') {
    return 'gemini-2.5-flash';
  }
  return model;
}

export async function GET() {
  try {
    const org = dbStore.getOrganizations()[0];
    const settings = dbStore.getGeminiSettings(org?.id);
    const envKey = process.env.GEMINI_API_KEY;
    const activeKey = settings?.api_key_encrypted || envKey || '';

    return NextResponse.json({
      settings: {
        org_id: org.id,
        has_key: Boolean(activeKey),
        masked_key: maskKey(activeKey),
        selected_model: normalizeModelName(settings?.selected_model),
        status: activeKey ? (settings?.status || 'Connected') : 'Not Connected',
        last_tested_at: settings?.last_tested_at || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { action, apiKey, selectedModel } = await req.json();
    const org = dbStore.getOrganizations()[0];
    const current = dbStore.getGeminiSettings(org.id);
    const modelToUse = normalizeModelName(selectedModel || current?.selected_model);

    if (action === 'save') {
      const keyToSave = apiKey ? apiKey.trim() : (current?.api_key_encrypted || null);
      let statusToSet = keyToSave ? 'Connected' : 'Not Connected';

      // If a key is provided, perform a quick verification
      if (keyToSave) {
        try {
          const ai = new GoogleGenAI({ apiKey: keyToSave });
          await ai.models.generateContent({
            model: modelToUse,
            contents: 'ping',
          });
          statusToSet = 'Active & Verified';
        } catch {
          // If ping fails with modelToUse, try gemini-flash-latest
          try {
            const ai = new GoogleGenAI({ apiKey: keyToSave });
            await ai.models.generateContent({
              model: 'gemini-flash-latest',
              contents: 'ping',
            });
            statusToSet = 'Active & Verified';
          } catch {
            statusToSet = 'Connected';
          }
        }
      }

      const updated = dbStore.saveGeminiSettings({
        org_id: org.id,
        api_key_encrypted: keyToSave,
        selected_model: modelToUse,
        status: statusToSet,
        last_tested_at: statusToSet === 'Active & Verified' ? new Date().toISOString() : (current?.last_tested_at || null),
        updated_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        masked_key: maskKey(updated.api_key_encrypted),
        status: updated.status,
        selected_model: updated.selected_model,
      });
    }

    if (action === 'test') {
      const keyToTest = (apiKey && apiKey.trim()) || current?.api_key_encrypted || process.env.GEMINI_API_KEY;
      if (!keyToTest) {
        return NextResponse.json({
          success: false,
          error: 'API Key belum diisi.',
        }, { status: 400 });
      }

      try {
        const ai = new GoogleGenAI({ apiKey: keyToTest });
        
        // Try requested model first, then fallback to gemini-2.5-flash, then gemini-flash-latest
        let activeModel = modelToUse;
        try {
          await ai.models.generateContent({
            model: activeModel,
            contents: 'Ping. Reply with "Pong"',
          });
        } catch (firstErr: any) {
          if (firstErr.message?.includes('404') || firstErr.message?.includes('not found')) {
            activeModel = 'gemini-2.5-flash';
            await ai.models.generateContent({
              model: activeModel,
              contents: 'Ping. Reply with "Pong"',
            });
          } else {
            throw firstErr;
          }
        }

        const updated = dbStore.saveGeminiSettings({
          org_id: org.id,
          api_key_encrypted: keyToTest,
          selected_model: activeModel,
          status: 'Active & Verified',
          last_tested_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        return NextResponse.json({
          success: true,
          message: `Koneksi ke Google Gemini API berhasil (${activeModel})!`,
          status: updated.status,
          last_tested_at: updated.last_tested_at,
          selected_model: updated.selected_model,
        });
      } catch (err: any) {
        dbStore.saveGeminiSettings({
          org_id: org.id,
          api_key_encrypted: keyToTest,
          selected_model: modelToUse,
          status: 'Connection Failed',
          last_tested_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        return NextResponse.json({
          success: false,
          error: `Gagal verifikasi API key: ${err.message || 'Error tidak diketahui'}`,
        }, { status: 400 });
      }
    }

    if (action === 'delete') {
      const updated = dbStore.saveGeminiSettings({
        org_id: org.id,
        api_key_encrypted: null,
        selected_model: 'gemini-2.5-flash',
        status: 'Not Connected',
        last_tested_at: null,
        updated_at: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, masked_key: '', status: updated.status });
    }

    return NextResponse.json({ error: 'Action not supported' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
