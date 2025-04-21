import OpenAI from "openai";
import { DocumentCategory, DOCUMENT_CATEGORIES } from "@shared/schema";
import config from "./config";

// Access AI config from centralized config
const aiConfig = config.ai;

// Check if we have Azure configuration
const useAzure = aiConfig.azureApiKey && aiConfig.azureEndpoint;

let openai: OpenAI;

if (useAzure) {
  console.log("Using Azure OpenAI configuration");
  console.log(`- Azure Endpoint: ${aiConfig.azureEndpoint}`);
  console.log(`- Azure Deployment: ${aiConfig.azureDeploymentName}`);
  
  openai = new OpenAI({
    apiKey: aiConfig.azureApiKey,
    baseURL: `${aiConfig.azureEndpoint}/openai/deployments/${aiConfig.azureDeploymentName}`,
    defaultQuery: { "api-version": aiConfig.apiVersion },
    defaultHeaders: { "api-key": aiConfig.azureApiKey },
  });
} else if (aiConfig.openaiApiKey) {
  console.log("Using standard OpenAI configuration");
  openai = new OpenAI({ apiKey: aiConfig.openaiApiKey });
} else {
  console.error("No OpenAI API keys provided. Please set OPENAI_API_KEY or AZURE_OPENAI_KEY and AZURE_OPENAI_ENDPOINT");
  // Create a placeholder client that will throw meaningful errors
  openai = new OpenAI({ apiKey: "placeholder" });
}

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

    // Use the appropriate model name - for Azure, this would be the deployment name
    const modelName = useAzure ? aiConfig.azureDeploymentName : aiConfig.defaultModel;
    
    const response = await openai.chat.completions.create({
      model: modelName, // Use appropriate model based on whether we're using Azure or standard OpenAI
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
    // Use the appropriate model name - for Azure, this would be the deployment name 
    const modelName = useAzure ? aiConfig.azureDeploymentName : aiConfig.defaultModel;
    
    const response = await openai.chat.completions.create({
      model: modelName, // Use appropriate model based on whether we're using Azure or standard OpenAI
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
      max_tokens: aiConfig.maxTokens,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Error extracting text from image:", error);
    return "";
  }
}
