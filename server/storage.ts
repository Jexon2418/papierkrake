import {
  users,
  documents,
  annotations,
  folders,
  type User,
  type InsertUser,
  type Document,
  type InsertDocument,
  type Annotation,
  type InsertAnnotation,
  type Folder,
  type InsertFolder,
  type DocumentCategory,
} from "@shared/schema";
import bcrypt from "bcrypt";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Document operations
  getAllDocuments(userId: number): Promise<Document[]>;
  getDocumentsByCategory(userId: number, category: DocumentCategory): Promise<Document[]>;
  getDocumentById(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  searchDocuments(userId: number, query: string): Promise<Document[]>;
  getDuePayments(userId: number): Promise<Document[]>;
  getPendingDocuments(userId: number): Promise<Document[]>;
  getOfflineDocuments(userId: number): Promise<Document[]>;

  // Annotation operations
  getAnnotationsByDocument(documentId: number): Promise<Annotation[]>;
  createAnnotation(annotation: InsertAnnotation): Promise<Annotation>;
  deleteAnnotation(id: number): Promise<boolean>;

  // Folder operations
  getAllFolders(): Promise<Folder[]>;
  createFolder(folder: InsertFolder): Promise<Folder>;
  updateFolderCount(folderId: number, count: number): Promise<Folder | undefined>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private documents: Map<number, Document>;
  private annotations: Map<number, Annotation>;
  private folders: Map<number, Folder>;
  private currentUserId: number;
  private currentDocumentId: number;
  private currentAnnotationId: number;
  private currentFolderId: number;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.annotations = new Map();
    this.folders = new Map();
    this.currentUserId = 1;
    this.currentDocumentId = 1;
    this.currentAnnotationId = 1;
    this.currentFolderId = 1;

    // Initialize with system folders
    this.initializeSystemFolders();
    
    // Initialize test user
    this.initTestUser();
  }
  
  private async initTestUser() {
    // Check if test user already exists
    const existingUser = await this.getUserByUsername("jexon");
    if (!existingUser) {
      // Create test user with bcrypt-hashed password
      const hashedPassword = await bcrypt.hash("Test123!", 10);
      
      await this.createUser({
        username: "jexon",
        password: hashedPassword,
        email: "jexon@example.com",
        fullName: "Test User"
      });
      
      console.log("Test user 'jexon' created successfully");
    }
  }

  private initializeSystemFolders() {
    const systemFolders: InsertFolder[] = [
      { name: "Alle Dokumente", color: "#1A5276", isSystem: true },
      { name: "Rechnungen", color: "#F39C12", isSystem: true },
      { name: "Steuer", color: "#3498DB", isSystem: true },
      { name: "Beschwerden", color: "#E74C3C", isSystem: true },
      { name: "Sonstiges", color: "#27AE60", isSystem: true },
    ];

    systemFolders.forEach(folder => {
      this.createFolder(folder);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // Document methods
  async getAllDocuments(userId: number): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter(doc => doc.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getDocumentsByCategory(userId: number, category: DocumentCategory): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter(doc => doc.userId === userId && doc.category === category)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getDocumentById(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentDocumentId++;
    const document: Document = {
      ...insertDocument,
      id,
      createdAt: new Date(),
      metadata: {},
      ocrText: "",
    };
    this.documents.set(id, document);

    // Update folder count
    if (document.category) {
      const folder = Array.from(this.folders.values()).find(
        f => f.name.toUpperCase().includes(document.category!)
      );
      if (folder) {
        this.updateFolderCount(folder.id, folder.documentCount + 1);
      }
    }

    return document;
  }

  async updateDocument(id: number, updatedFields: Partial<Document>): Promise<Document | undefined> {
    const existingDocument = this.documents.get(id);
    if (!existingDocument) return undefined;

    const updatedDocument = { ...existingDocument, ...updatedFields };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const document = this.documents.get(id);
    if (!document) return false;

    // Update folder count
    if (document.category) {
      const folder = Array.from(this.folders.values()).find(
        f => f.name.toUpperCase().includes(document.category!)
      );
      if (folder) {
        this.updateFolderCount(folder.id, folder.documentCount - 1);
      }
    }

    return this.documents.delete(id);
  }

  async searchDocuments(userId: number, query: string): Promise<Document[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.documents.values())
      .filter(doc => {
        return doc.userId === userId && (
          doc.filename.toLowerCase().includes(lowerQuery) ||
          doc.originalFilename.toLowerCase().includes(lowerQuery) ||
          (doc.ocrText && doc.ocrText.toLowerCase().includes(lowerQuery)) ||
          (doc.vendorName && doc.vendorName.toLowerCase().includes(lowerQuery))
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getDuePayments(userId: number): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter(doc => 
        doc.userId === userId && 
        doc.dueDate && 
        new Date(doc.dueDate) > new Date() &&
        !doc.isPaid
      )
      .sort((a, b) => 
        new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
      );
  }

  async getPendingDocuments(userId: number): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter(doc => doc.userId === userId && doc.status === 'PROCESSING')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getOfflineDocuments(userId: number): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter(doc => doc.userId === userId && doc.isOffline === true)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Annotation methods
  async getAnnotationsByDocument(documentId: number): Promise<Annotation[]> {
    return Array.from(this.annotations.values())
      .filter(annotation => annotation.documentId === documentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createAnnotation(insertAnnotation: InsertAnnotation): Promise<Annotation> {
    const id = this.currentAnnotationId++;
    const annotation: Annotation = {
      ...insertAnnotation,
      id,
      createdAt: new Date(),
    };
    this.annotations.set(id, annotation);
    return annotation;
  }

  async deleteAnnotation(id: number): Promise<boolean> {
    return this.annotations.delete(id);
  }

  // Folder methods
  async getAllFolders(): Promise<Folder[]> {
    return Array.from(this.folders.values());
  }

  async createFolder(insertFolder: InsertFolder): Promise<Folder> {
    const id = this.currentFolderId++;
    const folder: Folder = {
      ...insertFolder,
      id,
      documentCount: 0,
      createdAt: new Date(),
    };
    this.folders.set(id, folder);
    return folder;
  }

  async updateFolderCount(folderId: number, count: number): Promise<Folder | undefined> {
    const folder = this.folders.get(folderId);
    if (!folder) return undefined;

    const updatedFolder = { ...folder, documentCount: count };
    this.folders.set(folderId, updatedFolder);
    return updatedFolder;
  }
}

export const storage = new MemStorage();
