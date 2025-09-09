import Foundation
import Combine

// MARK: - Recording ViewModel
// Bridges UI and services for audio recording

@MainActor
class RecordingViewModel: ObservableObject {
    @Published var isRecording = false
    @Published var recordingDuration: TimeInterval = 0
    @Published var recordingURL: URL?
    @Published var errorMessage: String?
    @Published var isTranscribing = false
    @Published var transcriptionProgress: Double = 0
    
    private let audioRecordingService: any AudioRecordingService
    private let transcriptionService: any TranscriptionService
    private let meetingViewModel: MeetingViewModel
    private var cancellables = Set<AnyCancellable>()
    
    init(
        audioRecordingService: (any AudioRecordingService)? = nil,
        transcriptionService: (any TranscriptionService)? = nil,
        meetingViewModel: MeetingViewModel
    ) {
        self.audioRecordingService = audioRecordingService ?? AudioRecordingServiceImpl()
        self.transcriptionService = transcriptionService ?? TranscriptionServiceImpl()
        self.meetingViewModel = meetingViewModel
        
        setupBindings()
    }
    
    // MARK: - Setup
    
    private func setupBindings() {
        // Note: Protocol-based services don't expose @Published properties for binding
        // We'll handle state updates through method calls instead
    }
    
    // MARK: - Recording Control
    
    func startRecording() async {
        do {
            try await audioRecordingService.startRecording()
            // Update local state from service
            isRecording = audioRecordingService.isRecording
            errorMessage = audioRecordingService.errorMessage
        } catch {
            errorMessage = error.localizedDescription
        }
    }
    
    func stopRecording() async {
        do {
            let url = try await audioRecordingService.stopRecording()
            recordingURL = url
            // Update local state from service
            isRecording = audioRecordingService.isRecording
            recordingDuration = audioRecordingService.recordingDuration
            errorMessage = audioRecordingService.errorMessage
        } catch {
            errorMessage = error.localizedDescription
        }
    }
    
    func pauseRecording() async {
        do {
            try await audioRecordingService.pauseRecording()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
    
    func resumeRecording() async {
        do {
            try await audioRecordingService.resumeRecording()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
    
    func cancelRecording() async {
        do {
            try await audioRecordingService.cancelRecording()
            recordingURL = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }
    
    // MARK: - Transcription
    
    func transcribeRecording() async -> Transcript? {
        guard let url = recordingURL else {
            errorMessage = "No recording available to transcribe"
            return nil
        }
        
        do {
            return try await transcriptionService.transcribe(audioURL: url)
        } catch {
            errorMessage = "Failed to transcribe recording: \(error.localizedDescription)"
            return nil
        }
    }
    
    func saveRecordingAsMeeting(title: String, participants: [String] = []) async {
        guard let url = recordingURL else {
            errorMessage = "No recording available to save"
            return
        }
        
        let meeting = Meeting(
            title: title,
            startDate: Date().addingTimeInterval(-recordingDuration),
            endDate: Date(),
            participants: participants,
            recordingURL: url
        )
        
        await meetingViewModel.createMeeting(
            title: meeting.title,
            startDate: meeting.startDate,
            endDate: meeting.endDate,
            participants: meeting.participants
        )
    }
    
    // MARK: - Computed Properties
    
    var formattedDuration: String {
        let hours = Int(recordingDuration) / 3600
        let minutes = Int(recordingDuration) % 3600 / 60
        let seconds = Int(recordingDuration) % 60
        
        if hours > 0 {
            return String(format: "%d:%02d:%02d", hours, minutes, seconds)
        } else {
            return String(format: "%d:%02d", minutes, seconds)
        }
    }
    
    var canStartRecording: Bool {
        !isRecording && !isTranscribing
    }
    
    var canStopRecording: Bool {
        isRecording
    }
    
    var canTranscribe: Bool {
        recordingURL != nil && !isTranscribing
    }
    
    var hasRecording: Bool {
        recordingURL != nil
    }
}
