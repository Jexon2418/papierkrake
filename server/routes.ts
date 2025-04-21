import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { 
  insertUserSchema, 
  insertDocumentSchema, 
  insertAnnotationSchema, 
  insertFolderSchema 
} from "@shared/schema";
import { classifyDocument, extractTextFromImage } from "./openai";
import { generateS3Key, uploadFile, getSignedDownloadUrl, deleteFile } from "./s3";

const JWT_SECRET = process.env.JWT_SECRET || "papierkraken-secret-key";
const upload = multer({ dest: "uploads/" });

// Helper function for authentication middleware
function authenticateToken(req: Request, res: Response, next: Function) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Authentifizierung erforderlich" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: "Token ungültig oder abgelaufen" });
    }
    
    req.user = user;
    next();
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  app.post("/api/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Benutzername bereits vergeben" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user with hashed password
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      res.status(201).json({ 
        user: { 
          id: user.id, 
          username: user.username,
          email: user.email,
          fullName: user.fullName
        }, 
        token 
      });
    } catch (error) {
      res.status(400).json({ message: "Ungültige Benutzerdaten", error: error.message });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Benutzername oder Passwort ungültig" });
      }
      
      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Benutzername oder Passwort ungültig" });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      res.json({ 
        user: { 
          id: user.id, 
          username: user.username,
          email: user.email,
          fullName: user.fullName
        }, 
        token 
      });
    } catch (error) {
      res.status(400).json({ message: "Fehler bei der Anmeldung", error: error.message });
    }
  });

  // Document routes
  app.get("/api/documents", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const category = req.query.category as string;
      
      let documents;
      if (category) {
        documents = await storage.getDocumentsByCategory(userId, category as any);
      } else {
        documents = await storage.getAllDocuments(userId);
      }
      
      // Generate signed URLs for documents
      const documentsWithUrls = await Promise.all(
        documents.map(async (doc) => {
          if (doc.s3Key) {
            try {
              const downloadUrl = await getSignedDownloadUrl(doc.s3Key);
              return { ...doc, downloadUrl };
            } catch (error) {
              console.error(`Error generating download URL for ${doc.s3Key}:`, error);
              return doc;
            }
          }
          return doc;
        })
      );
      
      res.json({ documents: documentsWithUrls });
    } catch (error) {
      res.status(500).json({ message: "Fehler beim Abrufen der Dokumente", error: error.message });
    }
  });

  app.get("/api/documents/search", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({ message: "Suchbegriff erforderlich" });
      }
      
      const documents = await storage.searchDocuments(userId, query);
      
      // Generate signed URLs for documents
      const documentsWithUrls = await Promise.all(
        documents.map(async (doc) => {
          if (doc.s3Key) {
            try {
              const downloadUrl = await getSignedDownloadUrl(doc.s3Key);
              return { ...doc, downloadUrl };
            } catch (error) {
              console.error(`Error generating download URL for ${doc.s3Key}:`, error);
              return doc;
            }
          }
          return doc;
        })
      );
      
      res.json({ documents: documentsWithUrls });
    } catch (error) {
      res.status(500).json({ message: "Fehler bei der Suche", error: error.message });
    }
  });

  app.get("/api/documents/status", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const status = req.query.type as string;
      
      let documents = [];
      
      if (status === "due") {
        documents = await storage.getDuePayments(userId);
      } else if (status === "pending") {
        documents = await storage.getPendingDocuments(userId);
      } else if (status === "offline") {
        documents = await storage.getOfflineDocuments(userId);
      }
      
      res.json({ documents });
    } catch (error) {
      res.status(500).json({ message: "Fehler beim Abrufen der Dokumente", error: error.message });
    }
  });

  app.get("/api/documents/:id", authenticateToken, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocumentById(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Dokument nicht gefunden" });
      }
      
      // Check if user has access to this document
      if (document.userId !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung für dieses Dokument" });
      }
      
      // Generate download URL
      let documentWithUrl = document;
      if (document.s3Key) {
        try {
          const downloadUrl = await getSignedDownloadUrl(document.s3Key);
          documentWithUrl = { ...document, downloadUrl };
        } catch (error) {
          console.error(`Error generating download URL for ${document.s3Key}:`, error);
        }
      }
      
      res.json({ document: documentWithUrl });
    } catch (error) {
      res.status(500).json({ message: "Fehler beim Abrufen des Dokuments", error: error.message });
    }
  });

  app.post("/api/documents/upload", authenticateToken, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Keine Datei hochgeladen" });
      }
      
      const userId = req.user.id;
      const file = req.file;
      const originalFilename = file.originalname;
      const filePath = file.path;
      const fileSize = file.size;
      const mimeType = file.mimetype;
      
      // File validation
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(mimeType)) {
        // Clean up
        fs.unlinkSync(filePath);
        return res.status(400).json({ message: "Nicht unterstütztes Dateiformat" });
      }
      
      // Read file content
      const fileBuffer = fs.readFileSync(filePath);
      
      // Extract text from file (OCR)
      let extractedText = "";
      if (mimeType.startsWith('image/')) {
        const base64Image = fileBuffer.toString('base64');
        extractedText = await extractTextFromImage(base64Image);
      } else {
        // For PDFs, we'd ideally use a PDF parser library
        // This is simplified for the example
        extractedText = "PDF Content - requires PDF parsing library";
      }
      
      // Generate S3 key for the file
      const s3Key = generateS3Key(originalFilename, userId);
      
      // Upload to S3
      await uploadFile(fileBuffer, s3Key, mimeType);
      
      // Classify document using OCR text and filename
      const classification = await classifyDocument(extractedText, originalFilename);
      
      // Create document record in database
      const newDocument = await storage.createDocument({
        userId,
        filename: path.basename(s3Key),
        originalFilename,
        s3Key,
        fileType: mimeType.split('/')[1].toUpperCase(),
        fileSize,
        category: classification.category,
        status: 'COMPLETED',
        isOffline: false,
      });
      
      // Update document with OCR text and metadata
      const updatedDocument = await storage.updateDocument(newDocument.id, {
        ocrText: extractedText,
        metadata: classification.metadata,
        vendorName: classification.metadata.extractedVendor,
        amount: classification.metadata.extractedAmount,
        dueDate: classification.metadata.extractedDueDate ? new Date(classification.metadata.extractedDueDate) : undefined,
      });
      
      // Clean up temporary file
      fs.unlinkSync(filePath);
      
      // Generate download URL
      const downloadUrl = await getSignedDownloadUrl(s3Key);
      
      res.status(201).json({ 
        document: { 
          ...updatedDocument,
          downloadUrl
        } 
      });
    } catch (error) {
      console.error("Upload error:", error);
      
      // Clean up temp file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ message: "Fehler beim Hochladen des Dokuments", error: error.message });
    }
  });

  app.delete("/api/documents/:id", authenticateToken, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocumentById(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Dokument nicht gefunden" });
      }
      
      // Check if user has access to this document
      if (document.userId !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung für dieses Dokument" });
      }
      
      // Delete from S3 if exists
      if (document.s3Key) {
        await deleteFile(document.s3Key);
      }
      
      // Delete from database
      await storage.deleteDocument(documentId);
      
      res.json({ message: "Dokument erfolgreich gelöscht" });
    } catch (error) {
      res.status(500).json({ message: "Fehler beim Löschen des Dokuments", error: error.message });
    }
  });

  // Annotation routes
  app.get("/api/documents/:id/annotations", authenticateToken, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocumentById(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Dokument nicht gefunden" });
      }
      
      // Check if user has access to this document
      if (document.userId !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung für dieses Dokument" });
      }
      
      const annotations = await storage.getAnnotationsByDocument(documentId);
      
      res.json({ annotations });
    } catch (error) {
      res.status(500).json({ message: "Fehler beim Abrufen der Anmerkungen", error: error.message });
    }
  });

  app.post("/api/documents/:id/annotations", authenticateToken, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocumentById(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Dokument nicht gefunden" });
      }
      
      // Check if user has access to this document
      if (document.userId !== req.user.id) {
        return res.status(403).json({ message: "Keine Berechtigung für dieses Dokument" });
      }
      
      const annotationData = insertAnnotationSchema.parse({
        ...req.body,
        documentId,
        userId: req.user.id,
      });
      
      const newAnnotation = await storage.createAnnotation(annotationData);
      
      res.status(201).json({ annotation: newAnnotation });
    } catch (error) {
      res.status(500).json({ message: "Fehler beim Erstellen der Anmerkung", error: error.message });
    }
  });

  // Folder routes
  app.get("/api/folders", async (req, res) => {
    try {
      const folders = await storage.getAllFolders();
      
      res.json({ folders });
    } catch (error) {
      res.status(500).json({ message: "Fehler beim Abrufen der Ordner", error: error.message });
    }
  });

  const httpServer = createServer(app);
  
  // Create uploads directory if it doesn't exist
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
  }

  return httpServer;
}
