import Foundation
import Combine

// MARK: - Meeting ViewModel
// Bridges UI and services for meeting management

@MainActor
class MeetingViewModel: ObservableObject {
    @Published var meetings: [Meeting] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var selectedMeeting: Meeting?
    
    private let storageManager = StorageManager.shared
    private let calendarService: any CalendarService
    private let transcriptionService: any TranscriptionService
    private let aiSummaryService: any AISummaryService
    private var cancellables = Set<AnyCancellable>()
    
    init(
        calendarService: (any CalendarService)? = nil,
        transcriptionService: (any TranscriptionService)? = nil,
        aiSummaryService: (any AISummaryService)? = nil
    ) {
        self.calendarService = calendarService ?? CalendarServiceImpl()
        self.transcriptionService = transcriptionService ?? TranscriptionServiceImpl()
        self.aiSummaryService = aiSummaryService ?? AISummaryServiceImpl()
        
        setupBindings()
    }
    
    // MARK: - Setup
    
    private func setupBindings() {
        // Note: Protocol-based services don't expose @Published properties for binding
        // We'll handle state updates through method calls instead
    }
    
    // MARK: - Public Methods
    
    func loadMeetings() async {
        isLoading = true
        errorMessage = nil
        
        do {
            try await calendarService.loadUpcomingMeetings()
            // Update local state from service
            meetings = calendarService.meetings
            errorMessage = calendarService.errorMessage
            isLoading = false
        } catch {
            isLoading = false
            errorMessage = error.localizedDescription
        }
    }
    
    func createMeeting(title: String, startDate: Date, endDate: Date, participants: [String] = []) async {
        let meeting = Meeting(
            title: title,
            startDate: startDate,
            endDate: endDate,
            participants: participants
        )
        
        do {
            try await calendarService.createMeeting(meeting)
        } catch {
            errorMessage = "Failed to create meeting: \(error.localizedDescription)"
        }
    }
    
    func updateMeeting(_ meeting: Meeting) async {
        do {
            try await calendarService.updateMeeting(meeting)
        } catch {
            errorMessage = "Failed to update meeting: \(error.localizedDescription)"
        }
    }
    
    func deleteMeeting(_ meeting: Meeting) async {
        do {
            try await calendarService.deleteMeeting(meeting)
        } catch {
            errorMessage = "Failed to delete meeting: \(error.localizedDescription)"
        }
    }
    
    func transcribeMeeting(_ meeting: Meeting) async {
        guard let recordingURL = meeting.recordingURL else {
            errorMessage = "No recording available for this meeting"
            return
        }
        
        do {
            let transcript = try await transcriptionService.transcribe(audioURL: recordingURL, for: meeting)
            
            // Update meeting with transcript
            meeting.transcript = transcript
            meeting.updatedAt = Date()
            
            try await calendarService.updateMeeting(meeting)
            
        } catch {
            errorMessage = "Failed to transcribe meeting: \(error.localizedDescription)"
        }
    }
    
    func generateSummary(for meeting: Meeting) async -> String? {
        guard let transcript = meeting.transcript else {
            errorMessage = "No transcript available for this meeting"
            return nil
        }
        
        do {
            return try await aiSummaryService.generateSummary(for: transcript)
        } catch {
            errorMessage = "Failed to generate summary: \(error.localizedDescription)"
            return nil
        }
    }
    
    func generateActionItems(for meeting: Meeting) async -> [String]? {
        guard let transcript = meeting.transcript else {
            errorMessage = "No transcript available for this meeting"
            return nil
        }
        
        do {
            return try await aiSummaryService.generateActionItems(for: transcript)
        } catch {
            errorMessage = "Failed to generate action items: \(error.localizedDescription)"
            return nil
        }
    }
    
    // MARK: - Computed Properties
    
    var upcomingMeetings: [Meeting] {
        meetings.filter { $0.startDate > Date() }
    }
    
    var pastMeetings: [Meeting] {
        meetings.filter { $0.endDate < Date() }
    }
    
    var meetingsWithRecordings: [Meeting] {
        meetings.filter { $0.hasRecording }
    }
    
    var meetingsWithTranscripts: [Meeting] {
        meetings.filter { $0.hasTranscript }
    }
    
    var inProgressMeetings: [Meeting] {
        meetings.filter { $0.isInProgress }
    }
}
