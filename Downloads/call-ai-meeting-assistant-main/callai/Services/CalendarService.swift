import Foundation
import EventKit
import Combine

// MARK: - Calendar Service Implementation
// Clean implementation mapping EKEvent -> Meeting

@MainActor
class CalendarServiceImpl: NSObject, CalendarService {
    @MainActor @Published var meetings: [Meeting] = []
    @MainActor @Published var authorizationStatus: EKAuthorizationStatus = .notDetermined
    @MainActor @Published var errorMessage: String?
    
    private let eventStore = EKEventStore()
    private let storageManager = StorageManager.shared
    
    override init() {
        super.init()
        checkAuthorizationStatus()
    }
    
    // MARK: - Authorization
    
    private func checkAuthorizationStatus() {
        authorizationStatus = EKEventStore.authorizationStatus(for: .event)
    }
    
    func requestPermission() async throws {
        _ = try await eventStore.requestFullAccessToEvents()
        
        await MainActor.run {
            authorizationStatus = EKEventStore.authorizationStatus(for: .event)
        }
        
        guard authorizationStatus == .fullAccess else {
            throw ServiceError.permissionDenied
        }
    }
    
    // MARK: - Meeting Management
    
    func loadUpcomingMeetings() async throws {
        guard authorizationStatus == .fullAccess else {
            try await requestPermission()
            return
        }
        
        do {
            let events = fetchUpcomingEvents()
            let mappedMeetings = events.compactMap { mapEventToMeeting($0) }
            
            await MainActor.run {
                self.meetings = mappedMeetings
                self.errorMessage = nil
            }
            
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
            }
            throw ServiceError.unknown(error)
        }
    }
    
    func createMeeting(_ meeting: Meeting) async throws {
        guard authorizationStatus == .fullAccess else {
            throw ServiceError.notAuthorized
        }
        
        do {
            let event = mapMeetingToEvent(meeting)
            try eventStore.save(event, span: .thisEvent)
            
            // Reload meetings to include the new one
            try await loadUpcomingMeetings()
            
        } catch {
            await MainActor.run {
                self.errorMessage = "Failed to create meeting: \(error.localizedDescription)"
            }
            throw ServiceError.unknown(error)
        }
    }
    
    func updateMeeting(_ meeting: Meeting) async throws {
        guard authorizationStatus == .fullAccess else {
            throw ServiceError.notAuthorized
        }
        
        // Find the corresponding event
        guard let event = findEvent(for: meeting) else {
            throw ServiceError.invalidInput("Meeting not found in calendar")
        }
        
        do {
            // Update event properties
            event.title = meeting.title
            event.startDate = meeting.startDate
            event.endDate = meeting.endDate
            event.notes = meeting.participants.joined(separator: ", ")
            
            try eventStore.save(event, span: .thisEvent)
            
            // Reload meetings
            try await loadUpcomingMeetings()
            
        } catch {
            await MainActor.run {
                self.errorMessage = "Failed to update meeting: \(error.localizedDescription)"
            }
            throw ServiceError.unknown(error)
        }
    }
    
    func deleteMeeting(_ meeting: Meeting) async throws {
        guard authorizationStatus == .fullAccess else {
            throw ServiceError.notAuthorized
        }
        
        guard let event = findEvent(for: meeting) else {
            throw ServiceError.invalidInput("Meeting not found in calendar")
        }
        
        do {
            try eventStore.remove(event, span: .thisEvent)
            
            // Reload meetings
            try await loadUpcomingMeetings()
            
        } catch {
            await MainActor.run {
                self.errorMessage = "Failed to delete meeting: \(error.localizedDescription)"
            }
            throw ServiceError.unknown(error)
        }
    }
    
    // MARK: - Private Methods
    
    private func fetchUpcomingEvents() -> [EKEvent] {
        let calendar = Calendar.current
        let now = Date()
        let endDate = calendar.date(byAdding: .month, value: 3, to: now) ?? now
        let predicate = eventStore.predicateForEvents(withStart: now, end: endDate, calendars: nil)
        return eventStore.events(matching: predicate)
    }
    
    private func mapEventToMeeting(_ event: EKEvent) -> Meeting? {
        // Skip all-day events
        guard !event.isAllDay else { return nil }
        
        // Extract participants from attendees
        let participants = event.attendees?.compactMap { $0.name } ?? []
        
        // Determine call type based on event properties
        let callType: CallType = determineCallType(from: event)
        let callDirection: CallDirection = .unknown // Calendar events don't have direction
        
        return Meeting(
            title: event.title ?? "Untitled Meeting",
            startDate: event.startDate,
            endDate: event.endDate,
            participants: participants,
            callType: callType,
            callDirection: callDirection,
            isInProgress: false
        )
    }
    
    private func mapMeetingToEvent(_ meeting: Meeting) -> EKEvent {
        let event = EKEvent(eventStore: eventStore)
        event.title = meeting.title
        event.startDate = meeting.startDate
        event.endDate = meeting.endDate
        event.notes = meeting.participants.joined(separator: ", ")
        event.calendar = eventStore.defaultCalendarForNewEvents
        
        return event
    }
    
    private func findEvent(for meeting: Meeting) -> EKEvent? {
        // This is a simplified implementation
        // In a real app, you'd store the event identifier with the meeting
        return meetings.first { $0.id == meeting.id } != nil ? nil : nil
    }
    
    private func determineCallType(from event: EKEvent) -> CallType {
        let title = event.title?.lowercased() ?? ""
        let notes = event.notes?.lowercased() ?? ""
        let location = event.location?.lowercased() ?? ""
        
        let text = "\(title) \(notes) \(location)"
        
        if text.contains("video") || text.contains("zoom") || text.contains("teams") || text.contains("meet") {
            return .video
        } else if text.contains("phone") || text.contains("call") {
            return .voice
        } else if text.contains("facetime") {
            return .facetime
        } else {
            return .unknown
        }
    }
}

// MARK: - Service Factory Extension

extension ServiceFactory {
    @MainActor
    static func createCalendarService() -> any CalendarService {
        return CalendarServiceImpl()
    }
}
