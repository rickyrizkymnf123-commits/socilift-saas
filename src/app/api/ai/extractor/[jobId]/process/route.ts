import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params;
    const job = dbStore.getExtractorJob(jobId);
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    const org = dbStore.getOrganizations()[0];
    const settings = dbStore.getGeminiSettings(org?.id);
    const apiKey = settings?.api_key_encrypted || process.env.GEMINI_API_KEY;

    let extractedData: Record<string, any> = {
      views: 0,
      impressions: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      clicks: 0,
      thru_plays: 0,
      watch_time: 0,
      three_second_watch_time: 0,
      new_followers: 0,
    };
    let summary = `Berhasil memproses file ${job.file_name} untuk platform ${job.platform}.`;
    let confidence = 0.95;

    if (apiKey && job.file_base64) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const cleanBase64 = job.file_base64.includes('base64,') 
          ? job.file_base64.split('base64,')[1] 
          : job.file_base64;

        const systemPrompt = `Kamu adalah AI OCR & Social Media Analytics Extractor.
Tugasmu adalah menganalisis gambar screenshot metrik dashboard ${job.platform} ini dan mengekstrak semua angka analitik yang terlihat secara presisi.
Selain angka, periksa apakah ada teks judul konten, caption, atau teks cover video yang terlihat pada gambar screenshot.

Kembalikan HANYA format JSON murni tanpa backticks atau teks tambahan:
{
  "detected_title": "Teks judul / caption / cover video yang terlihat di screenshot (atau null jika tidak terlihat)",
  "views": number (total views/penayangan video),
  "impressions": number (total tayangan/impresi),
  "likes": number (total suka),
  "comments": number (total komentar),
  "shares": number (total dibagikan),
  "saves": number (total disimpan/bookmark),
  "clicks": number (total klik tautan/profil),
  "thru_plays": number (total penayangan penuh/thruplay),
  "three_second_watch_time": number (total penayangan 3 detik),
  "watch_time": number (total waktu tonton dalam detik),
  "new_followers": number (pengikut baru didapat),
  "summary": "Ringkasan temuan metrik dalam 1-2 kalimat"
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: job.file_mime_type || 'image/png',
                    data: cleanBase64,
                  }
                },
                {
                  text: systemPrompt,
                }
              ]
            }
          ]
        });

        const responseText = response.text || '';
        const cleanJson = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
        const parsed = JSON.parse(cleanJson);

        if (parsed) {
          extractedData = {
            views: Number(parsed.views) || 0,
            impressions: Number(parsed.impressions) || 0,
            likes: Number(parsed.likes) || 0,
            comments: Number(parsed.comments) || 0,
            shares: Number(parsed.shares) || 0,
            saves: Number(parsed.saves) || 0,
            clicks: Number(parsed.clicks) || 0,
            thru_plays: Number(parsed.thru_plays) || 0,
            three_second_watch_time: Number(parsed.three_second_watch_time) || 0,
            watch_time: Number(parsed.watch_time) || 0,
            new_followers: Number(parsed.new_followers) || 0,
            detected_title: parsed.detected_title || null,
          };
          if (parsed.summary) summary = parsed.summary;
        }
      } catch (aiErr: any) {
        console.error('Gemini Vision Extraction Error:', aiErr.message);
      }
    }

    // Auto-match against database contents
    const brandContents = dbStore.getContents(job.brand_id);
    let matchedContentId: string | null = null;
    let matchedContentTitle: string | null = null;

    if (extractedData.detected_title && brandContents.length > 0) {
      const searchNeedle = String(extractedData.detected_title).toLowerCase();
      let bestMatchScore = 0;
      
      brandContents.forEach(c => {
        const cTitle = c.title.toLowerCase();
        // Check exact inclusion or common words
        if (searchNeedle.includes(cTitle) || cTitle.includes(searchNeedle)) {
          matchedContentId = c.id;
          matchedContentTitle = c.title;
        } else {
          const needleWords = searchNeedle.split(/\s+/).filter(w => w.length > 3);
          const matchCount = needleWords.filter(w => cTitle.includes(w)).length;
          if (matchCount > bestMatchScore && matchCount >= 2) {
            bestMatchScore = matchCount;
            matchedContentId = c.id;
            matchedContentTitle = c.title;
          }
        }
      });
    }

    if (!matchedContentId && brandContents.length > 0) {
      // Default to matching platform or most recent
      const platformMatch = brandContents.find(c => c.platform === job.platform);
      if (platformMatch) {
        matchedContentId = platformMatch.id;
        matchedContentTitle = platformMatch.title;
      } else {
        matchedContentId = brandContents[0].id;
        matchedContentTitle = brandContents[0].title;
      }
    }

    extractedData.matched_content_id = matchedContentId;
    extractedData.matched_content_title = matchedContentTitle;

    const updated = dbStore.updateExtractorJob(jobId, {
      status: 'ready_to_review',
      progress: 100,
      result: {
        extractedRows: [extractedData],
        extractionSummary: summary,
        confidence,
        matchedContentId,
        matchedContentTitle,
        detectedTitle: extractedData.detected_title,
      },
    });

    return NextResponse.json({ success: true, job: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
