import Foundation
import AVFoundation
import EventKit

// MARK: - Service Protocols
// Clean, protocol-based architecture for all services

// MARK: - Audio Recording Service

@MainActor
protocol AudioRecordingService: ObservableObject {
    var isRecording: Bool { get }
    var recordingDuration: TimeInterval { get }
    var recordingURL: URL? { get }
    var errorMessage: String? { get }
    
    func startRecording() async throws
    func stopRecording() async throws -> URL
    func pauseRecording() async throws
    func resumeRecording() async throws
    func cancelRecording() async throws
}

// MARK: - Transcription Service

@MainActor
protocol TranscriptionService: ObservableObject {
    var isTranscribing: Bool { get }
    var progress: Double { get }
    var errorMessage: String? { get }
    var authorizationStatus: TranscriptionAuthorizationStatus { get }
    
    func requestPermission() async throws
    func transcribe(audioURL: URL) async throws -> Transcript
    func transcribe(audioURL: URL, for meeting: Meeting) async throws -> Transcript
}

enum TranscriptionAuthorizationStatus {
    case notDetermined
    case denied
    case restricted
    case authorized
    
    var isAuthorized: Bool {
        self == .authorized
    }
}

// MARK: - Calendar Service

@MainActor
protocol CalendarService: ObservableObject {
    var meetings: [Meeting] { get }
    var authorizationStatus: EKAuthorizationStatus { get }
    var errorMessage: String? { get }
    
    func requestPermission() async throws
    func loadUpcomingMeetings() async throws
    func createMeeting(_ meeting: Meeting) async throws
    func updateMeeting(_ meeting: Meeting) async throws
    func deleteMeeting(_ meeting: Meeting) async throws
}

// MARK: - AI Summary Service

@MainActor
protocol AISummaryService: ObservableObject {
    var isGenerating: Bool { get }
    var errorMessage: String? { get }
    
    func generateSummary(for transcript: Transcript) async throws -> String
    func generateActionItems(for transcript: Transcript) async throws -> [String]
    func generateKeywords(for transcript: Transcript) async throws -> [String]
}

// MARK: - Authentication Service

@MainActor
protocol AuthenticationService: ObservableObject {
    var isAuthenticated: Bool { get }
    var currentUser: User? { get }
    var errorMessage: String? { get }
    
    func signIn(email: String, password: String) async throws
    func signUp(email: String, password: String) async throws
    func signOut() async throws
    func resetPassword(email: String) async throws
}

// MARK: - User Model

struct User: Identifiable, Codable {
    let id: UUID
    let email: String
    let name: String?
    let createdAt: Date
    let lastLoginAt: Date?
    
    init(
        id: UUID = UUID(),
        email: String,
        name: String? = nil,
        createdAt: Date = Date(),
        lastLoginAt: Date? = nil
    ) {
        self.id = id
        self.email = email
        self.name = name
        self.createdAt = createdAt
        self.lastLoginAt = lastLoginAt
    }
}

// MARK: - Service Errors

enum ServiceError: LocalizedError {
    case notAuthorized
    case permissionDenied
    case networkError(Error)
    case invalidInput(String)
    case serviceUnavailable
    case unknown(Error)
    case invalidURL(String)
    case dataCorruption
    case fileNotFound(String)
    case insufficientStorage
    case rateLimitExceeded
    case invalidAPIKey
    case transcriptionFailed(String)
    case exportFailed(String)
    case audioProcessingFailed(String)
    
    var errorDescription: String? {
        switch self {
        case .notAuthorized:
            return "Not authorized to perform this action"
        case .permissionDenied:
            return "Permission denied"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .invalidInput(let message):
            return "Invalid input: \(message)"
        case .serviceUnavailable:
            return "Service is currently unavailable"
        case .unknown(let error):
            return "Unknown error: \(error.localizedDescription)"
        case .invalidURL(let url):
            return "Invalid URL: \(url)"
        case .dataCorruption:
            return "Data corruption detected"
        case .fileNotFound(let path):
            return "File not found: \(path)"
        case .insufficientStorage:
            return "Insufficient storage space"
        case .rateLimitExceeded:
            return "Rate limit exceeded. Please try again later."
        case .invalidAPIKey:
            return "Invalid API key. Please check your configuration."
        case .transcriptionFailed(let reason):
            return "Transcription failed: \(reason)"
        case .exportFailed(let reason):
            return "Export failed: \(reason)"
        case .audioProcessingFailed(let reason):
            return "Audio processing failed: \(reason)"
        }
    }
    
    var recoverySuggestion: String? {
        switch self {
        case .notAuthorized, .permissionDenied:
            return "Please check your permissions in Settings"
        case .networkError:
            return "Check your internet connection and try again"
        case .invalidInput:
            return "Please verify your input and try again"
        case .serviceUnavailable:
            return "The service is temporarily unavailable. Please try again later"
        case .invalidURL:
            return "Please check the URL configuration"
        case .dataCorruption:
            return "Please try again or contact support if the problem persists"
        case .fileNotFound:
            return "The file may have been moved or deleted"
        case .insufficientStorage:
            return "Free up some storage space and try again"
        case .rateLimitExceeded:
            return "Wait a few minutes before trying again"
        case .invalidAPIKey:
            return "Please update your API key in Settings"
        case .transcriptionFailed:
            return "Try recording again or check your audio quality"
        case .exportFailed:
            return "Try a different export format or check available storage"
        case .audioProcessingFailed:
            return "Try recording again with better audio quality"
        case .unknown:
            return "Please try again or contact support"
        }
    }
}

// MARK: - Service Configuration

struct ServiceConfiguration {
    let recordingQuality: RecordingQuality
    let transcriptionLanguage: String
    let maxRecordingDuration: TimeInterval
    let enableAutoTranscription: Bool
    
    static let `default` = ServiceConfiguration(
        recordingQuality: .standard,
        transcriptionLanguage: "en-US",
        maxRecordingDuration: 3600, // 1 hour
        enableAutoTranscription: true
    )
}
