import SwiftUI
import SwiftData

@MainActor
class MeetingSelectionManager: ObservableObject {
    static let shared = MeetingSelectionManager()
    
    @Published var pendingMeeting: Meeting?
    @Published var shouldNavigateToRecord = false
    
    private init() {}
    
    func selectMeetingForRecording(_ meeting: Meeting) {
        pendingMeeting = meeting
        shouldNavigateToRecord = true
    }
    
    func consumePendingMeeting() -> Meeting? {
        let meeting = pendingMeeting
        pendingMeeting = nil
        shouldNavigateToRecord = false
        return meeting
    }
}