// Document categories with German labels and colors
export const DOCUMENT_CATEGORIES = {
  INVOICE: {
    label: "Rechnung",
    color: "yellow",
  },
  TAX: {
    label: "Steuer",
    color: "blue",
  },
  COMPLAINT: {
    label: "Beschwerde",
    color: "red",
  },
  OTHER: {
    label: "Sonstiges",
    color: "green",
  },
};

// Document statuses with German labels
export const DOCUMENT_STATUSES = {
  PROCESSING: {
    label: "Wird verarbeitet",
  },
  COMPLETED: {
    label: "Fertig",
  },
  ERROR: {
    label: "Fehler",
  },
  SYNCING: {
    label: "Wird synchronisiert",
  },
};

// Folder system with corresponding icons and colors
export const FOLDERS = {
  ALL: {
    id: "all",
    name: "Alle Dokumente",
    icon: "FileText",
    color: "primary",
  },
  INVOICES: {
    id: "invoices",
    name: "Rechnungen",
    icon: "FileText",
    color: "yellow",
  },
  TAX: {
    id: "tax",
    name: "Steuer",
    icon: "FileText",
    color: "blue",
  },
  COMPLAINTS: {
    id: "complaints",
    name: "Beschwerden",
    icon: "FileText",
    color: "red",
  },
  OTHER: {
    id: "other",
    name: "Sonstiges",
    icon: "FileText",
    color: "green",
  },
};

// Status items with corresponding icons
export const STATUS_ITEMS = {
  PENDING: {
    id: "pending",
    name: "Ausstehend",
    icon: "Clock",
    color: "orange",
  },
  DUE: {
    id: "due",
    name: "Zahlung fällig",
    icon: "AlertTriangle",
    color: "red",
  },
  OFFLINE: {
    id: "offline",
    name: "Nicht synchronisiert",
    icon: "Cloud",
    color: "gray",
  },
};

// Accepted file types for upload
export const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

export const FILE_TYPE_EXTENSIONS = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg, .jpeg",
  "image/png": ".png",
};

// Language constants
export const LANG = {
  APP_TITLE: "PapierKraken",
  UPLOAD_BUTTON: "Dokument hochladen",
  UPLOAD_ZONE_TITLE: "Dokumente hier ablegen",
  UPLOAD_ZONE_OR: "oder",
  UPLOAD_ZONE_SELECT_FILES: "Dateien auswählen",
  UPLOAD_ZONE_FORMATS: "Unterstützte Formate: PDF, JPEG, PNG",
  SEARCH_PLACEHOLDER: "Dokumente durchsuchen...",
  FOLDERS_TITLE: "Ordner",
  STATUS_TITLE: "Status",
  SETTINGS: "Einstellungen",
  LOGIN_TITLE: "Anmeldung",
  LOGIN_BUTTON: "Anmelden",
  REGISTER_TITLE: "Registrierung",
  REGISTER_BUTTON: "Registrieren",
  USERNAME_PLACEHOLDER: "Benutzername",
  PASSWORD_PLACEHOLDER: "Passwort",
  EMAIL_PLACEHOLDER: "E-Mail",
  FULLNAME_PLACEHOLDER: "Vollständiger Name",
  ERROR_REQUIRED: "Pflichtfeld",
  ERROR_LOGIN: "Anmeldung fehlgeschlagen",
  ERROR_UPLOAD: "Upload fehlgeschlagen",
  LOGOUT: "Abmelden",
  NO_DOCUMENTS: "Keine Dokumente gefunden",
  DOCUMENT_ACTIONS: {
    EDIT: "Bearbeiten",
    DOWNLOAD: "Herunterladen",
    DELETE: "Löschen",
    MORE: "Mehr",
  },
  DOCUMENT_COUNT: "Dokumente gefunden",
  LOADING: "Wird geladen...",
  UPLOADING: "Wird hochgeladen...",
  PROCESSING: "Wird verarbeitet...",
  FILTER: "Filter",
  VIEW_LIST: "Listenansicht",
  VIEW_GRID: "Kachelansicht",
};

// Default user for development
export const DEFAULT_USER = {
  id: 1,
  username: "demo",
  email: "demo@papierkraken.de",
  fullName: "Demo User",
};
