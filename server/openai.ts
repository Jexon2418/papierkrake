import OpenAI from "openai";
import { DocumentCategory, DOCUMENT_CATEGORIES } from "@shared/schema";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || process.env.AZURE_OPENAI_KEY });

// Type for document classification result
type ClassificationResult = {
  category: DocumentCategory;
  confidence: number;
  metadata: {
    extractedDate?: string;
    extractedAmount?: string;
    extractedVendor?: string;
    extractedDueDate?: string;
    extractedInvoiceNumber?: string;
  };
};

/**
 * Performs document classification using OpenAI
 * @param text The extracted OCR text from the document
 * @param filename The original filename
 */
export async function classifyDocument(
  text: string,
  filename: string
): Promise<ClassificationResult> {
  try {
    const prompt = `
      Klassifiziere dieses Dokument in eine der folgenden Kategorien:
      - INVOICE (Rechnung)
      - TAX (Steuer)
      - COMPLAINT (Beschwerde)
      - OTHER (Sonstiges)
      
      Extrahiere außerdem aus dem Dokument, falls vorhanden:
      - Datum
      - Betrag
      - Firma/Anbieter
      - Fälligkeitsdatum
      - Rechnungsnummer
      
      Berücksichtige sowohl den extrahierten Text als auch den Dateinamen. Gib einen Konfidenzwert zwischen 0 und 1 an.
      
      Dokumenttext: ${text}
      Dateiname: ${filename}
      
      Antworte im JSON-Format:
      {
        "category": "KATEGORIE",
        "confidence": KONFIDENZWERT,
        "metadata": {
          "extractedDate": "DATUM",
          "extractedAmount": "BETRAG",
          "extractedVendor": "FIRMA",
          "extractedDueDate": "FÄLLIGKEITSDATUM",
          "extractedInvoiceNumber": "RECHNUNGSNUMMER"
        }
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "Du bist ein Dokumentenklassifizierungssystem, das deutsche und englische Dokumente verarbeitet." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content!) as ClassificationResult;
    
    // Validate category
    if (!DOCUMENT_CATEGORIES.includes(result.category)) {
      result.category = "OTHER";
    }

    return result;
  } catch (error) {
    console.error("Error classifying document:", error);
    return {
      category: "OTHER",
      confidence: 0,
      metadata: {}
    };
  }
}

/**
 * Extract text from an image using OpenAI's vision capabilities
 * @param base64Image The image as a base64 string
 */
export async function extractTextFromImage(base64Image: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extrahiere sämtlichen Text aus dem folgenden Dokument. Ignoriere Wasserzeichen und formatiere den Text klar und leserlich. Behalte die originale Struktur so gut wie möglich bei."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      max_tokens: 1000,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Error extracting text from image:", error);
    return "";
  }
}
