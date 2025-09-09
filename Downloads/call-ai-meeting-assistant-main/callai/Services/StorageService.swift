import Foundation
import Security

// MARK: - Storage Service Protocol
// Clean interface for data persistence

protocol StorageService: Sendable {
    func save<T: Codable & Sendable>(_ object: T, key: String) async throws
    func load<T: Codable & Sendable>(_ type: T.Type, key: String) async throws -> T?
    func delete(key: String) async throws
    func exists(key: String) async throws -> Bool
}

// MARK: - File-Based Storage Implementation
// Uses JSON files for meetings and transcripts

actor FileStorageService: StorageService {
    private let documentsDirectory: URL
    private let fileManager = FileManager.default
    
    init() throws {
        guard let documentsURL = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first else {
            throw StorageError.documentsDirectoryNotFound
        }
        self.documentsDirectory = documentsURL.appendingPathComponent("CallAI")
        
        // Create directory if it doesn't exist
        if !fileManager.fileExists(atPath: documentsDirectory.path) {
            try fileManager.createDirectory(at: documentsDirectory, withIntermediateDirectories: true)
        }
    }
    
    private func createDirectoryIfNeeded() throws {
        if !fileManager.fileExists(atPath: documentsDirectory.path) {
            try fileManager.createDirectory(at: documentsDirectory, withIntermediateDirectories: true)
        }
    }
    
    private func fileURL(for key: String) -> URL {
        documentsDirectory.appendingPathComponent("\(key).json")
    }
    
    func save<T: Codable & Sendable>(_ object: T, key: String) async throws {
        let url = fileURL(for: key)
        let data = try JSONEncoder().encode(object)
        try data.write(to: url)
    }
    
    func load<T: Codable & Sendable>(_ type: T.Type, key: String) async throws -> T? {
        let url = fileURL(for: key)
        
        guard fileManager.fileExists(atPath: url.path) else {
            return nil
        }
        
        let data = try Data(contentsOf: url)
        return try JSONDecoder().decode(type, from: data)
    }
    
    func delete(key: String) async throws {
        let url = fileURL(for: key)
        
        if fileManager.fileExists(atPath: url.path) {
            try fileManager.removeItem(at: url)
        }
    }
    
    func exists(key: String) async throws -> Bool {
        let url = fileURL(for: key)
        return fileManager.fileExists(atPath: url.path)
    }
}

// MARK: - Keychain Storage for Sensitive Data
// Secure storage for API keys, auth tokens, etc.

actor KeychainStorageService: StorageService {
    private let service = "com.callai.app"
    
    func save<T: Codable & Sendable>(_ object: T, key: String) async throws {
        let data = try JSONEncoder().encode(object)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecValueData as String: data
        ]
        
        // Delete existing item first
        SecItemDelete(query as CFDictionary)
        
        // Add new item
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw StorageError.keychainSaveFailed(status)
        }
    }
    
    func load<T: Codable & Sendable>(_ type: T.Type, key: String) async throws -> T? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess, let data = result as? Data else {
            if status == errSecItemNotFound {
                return nil
            }
            throw StorageError.keychainLoadFailed(status)
        }
        
        return try JSONDecoder().decode(type, from: data)
    }
    
    func delete(key: String) async throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key
        ]
        
        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw StorageError.keychainDeleteFailed(status)
        }
    }
    
    func exists(key: String) async throws -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: false,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        let status = SecItemCopyMatching(query as CFDictionary, nil)
        return status == errSecSuccess
    }
}

// MARK: - Storage Errors

enum StorageError: LocalizedError {
    case documentsDirectoryNotFound
    case keychainSaveFailed(OSStatus)
    case keychainLoadFailed(OSStatus)
    case keychainDeleteFailed(OSStatus)
    case encodingFailed
    case decodingFailed
    
    var errorDescription: String? {
        switch self {
        case .documentsDirectoryNotFound:
            return "Documents directory not found"
        case .keychainSaveFailed(let status):
            return "Keychain save failed with status: \(status)"
        case .keychainLoadFailed(let status):
            return "Keychain load failed with status: \(status)"
        case .keychainDeleteFailed(let status):
            return "Keychain delete failed with status: \(status)"
        case .encodingFailed:
            return "Failed to encode data"
        case .decodingFailed:
            return "Failed to decode data"
        }
    }
}

// MARK: - Storage Manager
// Main interface for the app to access storage

@MainActor
class StorageManager: ObservableObject {
    static let shared = StorageManager()
    
    private let fileStorage: FileStorageService
    private let keychainStorage: KeychainStorageService
    
    private init() {
        do {
            self.fileStorage = try FileStorageService()
            self.keychainStorage = KeychainStorageService()
        } catch {
            fatalError("Failed to initialize storage: \(error)")
        }
    }
    
    // MARK: - Public Interface
    
    func saveMeeting(_ meeting: Meeting) async throws {
        // SwiftData handles persistence automatically
        // This method is kept for API compatibility
    }
    
    func loadMeeting(id: UUID) async throws -> Meeting? {
        // SwiftData handles loading automatically
        // This method is kept for API compatibility
        return nil
    }
    
    func loadAllMeetings() async throws -> [Meeting] {
        // This is a simplified implementation
        // In a real app, you'd maintain an index of all meeting IDs
        return []
    }
    
    func deleteMeeting(id: UUID) async throws {
        try await fileStorage.delete(key: "meeting_\(id.uuidString)")
    }
    
    func saveTranscript(_ transcript: Transcript) async throws {
        // SwiftData handles persistence automatically
        // This method is kept for API compatibility
    }
    
    func loadTranscript(id: UUID) async throws -> Transcript? {
        // SwiftData handles loading automatically
        // This method is kept for API compatibility
        return nil
    }
    
    func deleteTranscript(id: UUID) async throws {
        try await fileStorage.delete(key: "transcript_\(id.uuidString)")
    }
    
    // MARK: - Keychain Operations
    
    func saveAPIKey(_ key: String) async throws {
        try await keychainStorage.save(key, key: "openai_api_key")
    }
    
    func loadAPIKey() async throws -> String? {
        return try await keychainStorage.load(String.self, key: "openai_api_key")
    }
    
    func deleteAPIKey() async throws {
        try await keychainStorage.delete(key: "openai_api_key")
    }
    
    // MARK: - Generic Storage Methods
    
    func save<T: Codable & Sendable>(_ object: T, key: String) async throws {
        try await fileStorage.save(object, key: key)
    }
    
    func load<T: Codable & Sendable>(_ type: T.Type, key: String) async throws -> T? {
        return try await fileStorage.load(type, key: key)
    }
    
    func delete(key: String) async throws {
        try await fileStorage.delete(key: key)
    }
}
