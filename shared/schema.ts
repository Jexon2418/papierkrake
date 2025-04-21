import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
});

// Document categories
export const DOCUMENT_CATEGORIES = [
  'INVOICE', // Rechnung
  'TAX', // Steuer
  'COMPLAINT', // Beschwerde
  'OTHER', // Sonstiges
] as const;

export type DocumentCategory = typeof DOCUMENT_CATEGORIES[number];

// Document statuses
export const DOCUMENT_STATUSES = [
  'PROCESSING', // Wird verarbeitet
  'COMPLETED', // Fertig
  'ERROR', // Fehler
  'SYNCING', // Wird synchronisiert
] as const;

export type DocumentStatus = typeof DOCUMENT_STATUSES[number];

// Document model
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  filename: text("filename").notNull(),
  originalFilename: text("original_filename").notNull(),
  s3Key: text("s3_key"),
  fileType: text("file_type").notNull(), // PDF, JPEG, PNG
  fileSize: integer("file_size").notNull(),
  category: text("category").$type<DocumentCategory>(),
  status: text("status").$type<DocumentStatus>().notNull().default('PROCESSING'),
  isOffline: boolean("is_offline").default(false),
  ocrText: text("ocr_text"),
  metadata: json("metadata").$type<DocumentMetadata>(),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  dueDate: timestamp("due_date"),
  vendorName: text("vendor_name"),
  amount: text("amount"),
  isPaid: boolean("is_paid").default(false),
});

// Document metadata type
export type DocumentMetadata = {
  confidenceScore?: number;
  extractedDate?: string;
  extractedAmount?: string;
  extractedVendor?: string;
  extractedDueDate?: string;
  extractedInvoiceNumber?: string;
};

export const insertDocumentSchema = createInsertSchema(documents).pick({
  userId: true,
  filename: true,
  originalFilename: true,
  s3Key: true,
  fileType: true,
  fileSize: true,
  category: true,
  status: true,
  isOffline: true,
});

// Annotations model
export const annotations = pgTable("annotations", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // TEXT, VOICE
  content: text("content"),
  audioUrl: text("audio_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAnnotationSchema = createInsertSchema(annotations).pick({
  documentId: true,
  userId: true,
  type: true,
  content: true,
  audioUrl: true,
});

// Folders model
export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color"), // hex color code
  documentCount: integer("document_count").default(0),
  isSystem: boolean("is_system").default(false), // For predefined system folders
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFolderSchema = createInsertSchema(folders).pick({
  name: true,
  color: true,
  isSystem: true,
});

// Types for frontend
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Annotation = typeof annotations.$inferSelect;
export type InsertAnnotation = z.infer<typeof insertAnnotationSchema>;

export type Folder = typeof folders.$inferSelect;
export type InsertFolder = z.infer<typeof insertFolderSchema>;

// Extended document type with additional frontend info
export type UIDocument = Document & {
  isUploading?: boolean;
  progress?: number;
  error?: string;
};
