import Foundation
import Speech
import Combine

// MARK: - Sendable DTOs for Cross-Actor Communication

/// Sendable DTO for speech recognition results to avoid data races
public struct SpeechRecognitionResultDTO: Sendable {
    let formattedString: String
    let isFinal: Bool
    
    init(from result: SFSpeechRecognitionResult) {
        self.formattedString = result.bestTranscription.formattedString
        self.isFinal = result.isFinal
    }
}

/// Unchecked Sendable wrapper for SFSpeechRecognitionResult
/// Safe because SFSpeechRecognitionResult is immutable after creation
struct SendableSpeechResult: @unchecked Sendable {
    let result: SFSpeechRecognitionResult
    
    init(_ result: SFSpeechRecognitionResult) {
        self.result = result
    }
}

// MARK: - Transcription Service Implementation
// Clean implementation using Speech framework with async/await

@MainActor
class TranscriptionServiceImpl: NSObject, TranscriptionService {
    @Published var isTranscribing = false
    @Published var progress: Double = 0
    @Published var errorMessage: String?
    @Published var authorizationStatus: TranscriptionAuthorizationStatus = .notDetermined
    
    private let speechRecognizer: SFSpeechRecognizer?
    private let storageManager = StorageManager.shared
    
    override init() {
        self.speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
        super.init()
        checkAuthorizationStatus()
    }
    
    // MARK: - Authorization
    
    private func checkAuthorizationStatus() {
        let status = SFSpeechRecognizer.authorizationStatus()
        authorizationStatus = mapAuthorizationStatus(status)
    }
    
    private func mapAuthorizationStatus(_ status: SFSpeechRecognizerAuthorizationStatus) -> TranscriptionAuthorizationStatus {
        switch status {
        case .notDetermined: return .notDetermined
        case .denied: return .denied
        case .restricted: return .restricted
        case .authorized: return .authorized
        @unknown default: return .notDetermined
        }
    }
    
    func requestPermission() async throws {
        let status = await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { status in
                continuation.resume(returning: status)
            }
        }
        
        authorizationStatus = mapAuthorizationStatus(status)
        
        guard status == .authorized else {
            throw ServiceError.permissionDenied
        }
    }
    
    // MARK: - Transcription
    
    func transcribe(audioURL: URL) async throws -> Transcript {
        guard authorizationStatus.isAuthorized else {
            try await requestPermission()
            // Recursively call after permission is granted
            return try await transcribe(audioURL: audioURL)
        }
        
        guard let recognizer = speechRecognizer, recognizer.isAvailable else {
            throw ServiceError.serviceUnavailable
        }
        
        isTranscribing = true
        progress = 0
        errorMessage = nil
        
        do {
            let result = try await performTranscription(audioURL: audioURL, recognizer: recognizer)
            
            let transcript = Transcript(
                content: result.bestTranscription.formattedString,
                confidence: calculateConfidence(from: result),
                meetingID: UUID() // Will be set by caller
            )
            
            isTranscribing = false
            progress = 1.0
            
            return transcript
            
        } catch {
            isTranscribing = false
            progress = 0
            errorMessage = error.localizedDescription
            throw ServiceError.unknown(error)
        }
    }
    
    func transcribe(audioURL: URL, for meeting: Meeting) async throws -> Transcript {
        var transcript = try await transcribe(audioURL: audioURL)
        
        // Update transcript with meeting ID
        transcript = Transcript(
            id: transcript.id,
            content: transcript.content,
            confidence: transcript.confidence,
            meetingID: meeting.id,
            createdAt: transcript.createdAt,
            updatedAt: Date()
        )
        
        // Save transcript
        try await storageManager.saveTranscript(transcript)
        
        return transcript
    }
    
    // MARK: - Private Methods
    
    private func performTranscription(audioURL: URL, recognizer: SFSpeechRecognizer) async throws -> SFSpeechRecognitionResult {
        let request = SFSpeechURLRecognitionRequest(url: audioURL)
        request.shouldReportPartialResults = false
        request.requiresOnDeviceRecognition = false
        
        return try await withCheckedThrowingContinuation { continuation in
            var hasContinued = false
            
            recognizer.recognitionTask(with: request) { result, error in
                if let error = error {
                    if !hasContinued {
                        hasContinued = true
                        continuation.resume(throwing: error)
                    }
                    return
                }
                
                if let result = result {
                    let isFinal = result.isFinal
                    let progressValue = isFinal ? 1.0 : 0.8
                    
                    Task { @MainActor in
                        self.progress = progressValue
                    }
                    
                    if isFinal {
                        if !hasContinued {
                            hasContinued = true
                            // Use Sendable wrapper to safely pass across actors
                            let sendableWrapper = SendableSpeechResult(result)
                            continuation.resume(returning: sendableWrapper.result)
                        }
                    }
                }
            }
        }
    }
    
    private func calculateConfidence(from result: SFSpeechRecognitionResult) -> Double {
        // Speech framework doesn't provide confidence scores on iOS
        // Return a default confidence based on transcription quality
        let wordCount = result.bestTranscription.formattedString.components(separatedBy: .whitespacesAndNewlines)
            .filter { !$0.isEmpty }
            .count
        
        // Simple heuristic: longer transcriptions are more likely to be accurate
        switch wordCount {
        case 0..<10: return 0.6
        case 10..<50: return 0.7
        case 50..<100: return 0.8
        default: return 0.85
        }
    }
}

// MARK: - Service Factory Extension

extension ServiceFactory {
    @MainActor
    static func createTranscriptionService() -> any TranscriptionService {
        return TranscriptionServiceImpl()
    }
}
