import Foundation
import AVFoundation
import SwiftUI

#if os(macOS)
enum MacOSRecordPermission {
    case granted
    case denied
    case notDetermined
}
#endif

@MainActor
class AudioRecordingService: NSObject, ObservableObject {
    @Published var isRecording = false
    @Published var recordingDuration: TimeInterval = 0
    @Published var recordingLevel: Float = 0
    @Published var errorMessage: String?
    
    #if os(iOS)
    @Published var authorizationStatus: AVAudioSession.RecordPermission = .undetermined
    #else
    @Published var authorizationStatus: MacOSRecordPermission = .notDetermined
    #endif
    
    private var audioRecorder: AVAudioRecorder?
    private var recordingTimer: Timer?
    private var levelTimer: Timer?
    private var recordingStartTime: Date?
    
    override init() {
        super.init()
        checkRecordingPermission()
        setupAudioSession()
    }
    
    func checkRecordingPermission() {
        #if os(iOS)
        authorizationStatus = AVAudioSession.sharedInstance().recordPermission
        #else
        // On macOS, check microphone permission using AVCaptureDevice
        switch AVCaptureDevice.authorizationStatus(for: .audio) {
        case .authorized:
            authorizationStatus = .granted
        case .denied, .restricted:
            authorizationStatus = .denied
        case .notDetermined:
            authorizationStatus = .notDetermined
        @unknown default:
            authorizationStatus = .notDetermined
        }
        #endif
    }
    
    func requestRecordingPermission() async {
        #if os(iOS)
        await AVAudioSession.sharedInstance().requestRecordPermission { [weak self] granted in
            Task { @MainActor in
                self?.authorizationStatus = granted ? .granted : .denied
            }
        }
        #else
        // Log the request
        PermissionDebugService.shared.log(
            type: .microphone,
            action: "Permission Request",
            result: "Initiated",
            details: "Calling AVCaptureDevice.requestAccess(for: .audio)"
        )
        
        // On macOS, request microphone permission using AVCaptureDevice
        await withCheckedContinuation { continuation in
            AVCaptureDevice.requestAccess(for: .audio) { [weak self] granted in
                Task { @MainActor in
                    self?.authorizationStatus = granted ? .granted : .denied
                    
                    // Log the result
                    PermissionDebugService.shared.log(
                        type: .microphone,
                        action: "Permission Response",
                        result: granted ? "Granted ✅" : "Denied ❌",
                        details: "User responded to permission dialog"
                    )
                    
                    continuation.resume()
                }
            }
        }
        #endif
    }
    
    private func setupAudioSession() {
        #if os(iOS)
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker])
            try session.setActive(true)
        } catch {
            errorMessage = "Failed to setup audio session: \(error.localizedDescription)"
        }
        #endif
        // macOS doesn't require session setup
    }
    
    func startRecording(for meeting: Meeting) async -> URL? {
        if authorizationStatus != .granted {
            await requestRecordingPermission()
            guard authorizationStatus == .granted else {
                errorMessage = "Recording permission not granted"
                return nil
            }
        }
        
        let fileName = "\(meeting.id.uuidString).m4a"
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let audioURL = documentsPath.appendingPathComponent(fileName)
        
        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey: 44100,
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
        ]
        
        do {
            audioRecorder = try AVAudioRecorder(url: audioURL, settings: settings)
            audioRecorder?.delegate = self
            audioRecorder?.isMeteringEnabled = true
            audioRecorder?.record()
            
            isRecording = true
            recordingStartTime = Date()
            recordingDuration = 0
            
            startTimers()
            
            meeting.recordingURL = audioURL
            meeting.isRecorded = true
            meeting.updatedAt = Date()
            
            return audioURL
        } catch {
            errorMessage = "Failed to start recording: \(error.localizedDescription)"
            return nil
        }
    }
    
    func stopRecording() {
        audioRecorder?.stop()
        isRecording = false
        stopTimers()
        
        #if os(iOS)
        do {
            try AVAudioSession.sharedInstance().setActive(false)
        } catch {
            errorMessage = "Failed to deactivate audio session: \(error.localizedDescription)"
        }
        #endif
        // macOS doesn't require session deactivation
    }
    
    private func startTimers() {
        recordingTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            Task { @MainActor in
                guard let self = self, let startTime = self.recordingStartTime else { return }
                self.recordingDuration = Date().timeIntervalSince(startTime)
            }
        }
        
        levelTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.updateRecordingLevel()
            }
        }
    }
    
    private func stopTimers() {
        recordingTimer?.invalidate()
        recordingTimer = nil
        levelTimer?.invalidate()
        levelTimer = nil
    }
    
    private func updateRecordingLevel() {
        guard let recorder = audioRecorder, recorder.isRecording else { return }
        
        recorder.updateMeters()
        let power = recorder.averagePower(forChannel: 0)
        let normalizedPower = max(0, (power + 60) / 60)
        recordingLevel = Float(normalizedPower)
    }
}

extension AudioRecordingService: AVAudioRecorderDelegate {
    nonisolated func audioRecorderDidFinishRecording(_ recorder: AVAudioRecorder, successfully flag: Bool) {
        Task { @MainActor in
            if !flag {
                errorMessage = "Recording finished unsuccessfully"
            }
        }
    }
    
    nonisolated func audioRecorderEncodeErrorDidOccur(_ recorder: AVAudioRecorder, error: Error?) {
        Task { @MainActor in
            if let error = error {
                errorMessage = "Recording encoding error: \(error.localizedDescription)"
            }
        }
    }
}