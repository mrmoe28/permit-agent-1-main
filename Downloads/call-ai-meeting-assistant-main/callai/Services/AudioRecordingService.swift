import Foundation
import AVFoundation
import Combine

// MARK: - Audio Recording Service Implementation
// Clean implementation using AVAudioSession best practices

@MainActor
class AudioRecordingServiceImpl: NSObject, AudioRecordingService {
    @Published var isRecording = false
    @Published var recordingDuration: TimeInterval = 0
    @Published var recordingURL: URL?
    @Published var errorMessage: String?
    
    private var audioRecorder: AVAudioRecorder?
    @MainActor
    private var recordingTimer: Timer?
    private var startTime: Date?
    private let storageManager = StorageManager.shared
    
    // MARK: - Configuration
    
    private let recordingSettings: [String: Any] = [
        AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
        AVSampleRateKey: 44100.0,
        AVNumberOfChannelsKey: 2,
        AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
    ]
    
    override init() {
        super.init()
        setupAudioSession()
    }
    
    deinit {
        // Timer cleanup is handled in explicit lifecycle methods
    }
    
    // MARK: - Audio Session Setup
    
    private func setupAudioSession() {
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker])
            try audioSession.setActive(true)
        } catch {
            errorMessage = "Failed to setup audio session: \(error.localizedDescription)"
        }
    }
    
    // MARK: - Recording Control
    
    func startRecording() async throws {
        guard !isRecording else {
            throw ServiceError.invalidInput("Recording is already in progress")
        }
        
        // Request microphone permission
        let permission = await requestMicrophonePermission()
        guard permission else {
            throw ServiceError.permissionDenied
        }
        
        // Create recording URL
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let fileName = "recording_\(UUID().uuidString).m4a"
        let url = documentsPath.appendingPathComponent(fileName)
        
        do {
            // Create audio recorder
            audioRecorder = try AVAudioRecorder(url: url, settings: recordingSettings)
            audioRecorder?.delegate = self
            audioRecorder?.isMeteringEnabled = true
            
            // Start recording
            guard audioRecorder?.record() == true else {
                throw ServiceError.serviceUnavailable
            }
            
            // Update state
            isRecording = true
            recordingURL = url
            startTime = Date()
            recordingDuration = 0
            errorMessage = nil
            
            // Start timer
            startRecordingTimer()
            
        } catch {
            errorMessage = "Failed to start recording: \(error.localizedDescription)"
            throw ServiceError.unknown(error)
        }
    }
    
    func stopRecording() async throws -> URL {
        guard isRecording, let recorder = audioRecorder else {
            throw ServiceError.invalidInput("No recording in progress")
        }
        
        // Stop recording
        recorder.stop()
        stopRecordingTimer()
        
        // Update state
        isRecording = false
        let finalURL = recordingURL
        
        // Clean up
        audioRecorder = nil
        recordingURL = nil
        startTime = nil
        
        guard let url = finalURL else {
            throw ServiceError.serviceUnavailable
        }
        
        return url
    }
    
    func pauseRecording() async throws {
        guard isRecording, let recorder = audioRecorder else {
            throw ServiceError.invalidInput("No recording in progress")
        }
        
        recorder.pause()
        stopRecordingTimer()
    }
    
    func resumeRecording() async throws {
        guard !isRecording, let recorder = audioRecorder else {
            throw ServiceError.invalidInput("Recording is not paused")
        }
        
        guard recorder.record() else {
            throw ServiceError.serviceUnavailable
        }
        
        isRecording = true
        startRecordingTimer()
    }
    
    func cancelRecording() async throws {
        guard let recorder = audioRecorder else {
            return
        }
        
        // Stop recording
        recorder.stop()
        stopRecordingTimer()
        
        // Delete the file
        if let url = recordingURL {
            try? FileManager.default.removeItem(at: url)
        }
        
        // Clean up
        isRecording = false
        audioRecorder = nil
        recordingURL = nil
        startTime = nil
        recordingDuration = 0
    }
    
    // MARK: - Permission Handling
    
    private func requestMicrophonePermission() async -> Bool {
        if #available(iOS 17.0, *) {
            return await AVAudioApplication.requestRecordPermission()
        } else {
            return await withCheckedContinuation { continuation in
                AVAudioSession.sharedInstance().requestRecordPermission { granted in
                    continuation.resume(returning: granted)
                }
            }
        }
    }
    
    // MARK: - Timer Management
    
    @MainActor
    private func startRecordingTimer() {
        recordingTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { @Sendable [weak self] _ in
            Task { @MainActor [weak self] in
                guard let self = self else {
                    return
                }
                self.updateRecordingDuration()
            }
        }
    }
    
    @MainActor
    private func stopRecordingTimer() {
        recordingTimer?.invalidate()
        recordingTimer = nil
    }
    
    @MainActor
    private func updateRecordingDuration() {
        guard let startTime = startTime else { return }
        recordingDuration = Date().timeIntervalSince(startTime)
    }
}

// MARK: - AVAudioRecorderDelegate

extension AudioRecordingServiceImpl: AVAudioRecorderDelegate {
    nonisolated func audioRecorderDidFinishRecording(_ recorder: AVAudioRecorder, successfully flag: Bool) {
        Task { @MainActor in
            if !flag {
                errorMessage = "Recording failed to complete successfully"
            }
        }
    }
    
    nonisolated func audioRecorderEncodeErrorDidOccur(_ recorder: AVAudioRecorder, error: Error?) {
        Task { @MainActor in
            if let error = error {
                errorMessage = "Recording error: \(error.localizedDescription)"
            }
        }
    }
}

// MARK: - Service Factory

class ServiceFactory {
    @MainActor
    static func createAudioRecordingService() -> any AudioRecordingService {
        return AudioRecordingServiceImpl()
    }
}
