import Foundation
import Speech
import SwiftUI

@MainActor
class TranscriptionService: ObservableObject {
    @Published var authorizationStatus: SFSpeechRecognizerAuthorizationStatus = .notDetermined
    @Published var isTranscribing = false
    @Published var transcriptionProgress: Double = 0
    @Published var errorMessage: String?
    
    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    
    init() {
        checkSpeechRecognitionPermission()
    }
    
    func checkSpeechRecognitionPermission() {
        authorizationStatus = SFSpeechRecognizer.authorizationStatus()
    }
    
    func requestSpeechRecognitionPermission() async {
        await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { [weak self] status in
                Task { @MainActor in
                    self?.authorizationStatus = status
                    continuation.resume()
                }
            }
        }
    }
    
    func transcribeAudio(from url: URL, for meeting: Meeting) async -> Transcript? {
        if authorizationStatus != .authorized {
            await requestSpeechRecognitionPermission()
            guard authorizationStatus == .authorized else {
                errorMessage = "Speech recognition permission not granted"
                return nil
            }
        }
        
        guard let recognizer = speechRecognizer, recognizer.isAvailable else {
            errorMessage = "Speech recognizer not available"
            return nil
        }
        
        isTranscribing = true
        transcriptionProgress = 0
        
        let request = SFSpeechURLRecognitionRequest(url: url)
        request.shouldReportPartialResults = true
        request.requiresOnDeviceRecognition = false
        
        do {
            let result = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<SFSpeechRecognitionResult, Error>) in
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
                        Task { @MainActor in
                            self.transcriptionProgress = result.isFinal ? 1.0 : 0.8
                        }
                        
                        if result.isFinal {
                            if !hasContinued {
                                hasContinued = true
                                continuation.resume(returning: result)
                            }
                        }
                    }
                }
            }
            
            let transcript = Transcript(
                content: result.bestTranscription.formattedString,
                confidence: 0.8, // Default confidence as averageConfidence is not available on macOS
                meeting: meeting
            )
            
            meeting.transcript = transcript
            meeting.updatedAt = Date()
            
            isTranscribing = false
            transcriptionProgress = 1.0
            
            return transcript
            
        } catch {
            isTranscribing = false
            errorMessage = "Transcription failed: \(error.localizedDescription)"
            return nil
        }
    }
    
    func transcribeAudioFile(at url: URL) async -> String? {
        guard authorizationStatus == .authorized else {
            await requestSpeechRecognitionPermission()
            guard authorizationStatus == .authorized else {
                errorMessage = "Speech recognition permission not granted"
                return nil
            }
            return nil
        }
        
        guard let recognizer = speechRecognizer, recognizer.isAvailable else {
            errorMessage = "Speech recognizer not available"
            return nil
        }
        
        let request = SFSpeechURLRecognitionRequest(url: url)
        request.shouldReportPartialResults = false
        request.requiresOnDeviceRecognition = false
        
        do {
            let result = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<SFSpeechRecognitionResult, Error>) in
                var hasContinued = false
                
                recognizer.recognitionTask(with: request) { result, error in
                    if let error = error {
                        if !hasContinued {
                            hasContinued = true
                            continuation.resume(throwing: error)
                        }
                        return
                    }
                    
                    if let result = result, result.isFinal {
                        if !hasContinued {
                            hasContinued = true
                            continuation.resume(returning: result)
                        }
                    }
                }
            }
            
            return result.bestTranscription.formattedString
            
        } catch {
            errorMessage = "Transcription failed: \(error.localizedDescription)"
            return nil
        }
    }
}