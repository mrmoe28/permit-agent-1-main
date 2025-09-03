import Foundation
import EventKit
import SwiftUI

@MainActor
class CalendarService: ObservableObject {
    @Published var meetings: [Meeting] = []
    @Published var authorizationStatus: EKAuthorizationStatus = .notDetermined
    @Published var errorMessage: String?
    
    private let eventStore = EKEventStore()
    
    init() {
        checkAuthorizationStatus()
    }
    
    func checkAuthorizationStatus() {
        authorizationStatus = EKEventStore.authorizationStatus(for: .event)
    }
    
    func requestCalendarAccess() async {
        do {
            let granted = try await eventStore.requestFullAccessToEvents()
            authorizationStatus = granted ? .fullAccess : .denied
            
            if granted {
                await loadUpcomingMeetings()
            }
        } catch {
            errorMessage = "Failed to request calendar access: \(error.localizedDescription)"
        }
    }
    
    func loadUpcomingMeetings() async {
        guard authorizationStatus == .fullAccess else {
            errorMessage = "Calendar access not granted"
            return
        }
        
        let calendar = Calendar.current
        let startDate = Date()
        let endDate = calendar.date(byAdding: .day, value: 7, to: startDate) ?? startDate
        
        let predicate = eventStore.predicateForEvents(
            withStart: startDate,
            end: endDate,
            calendars: nil
        )
        
        let events = eventStore.events(matching: predicate)
        
        meetings = events
            .filter { !$0.isAllDay }
            .map { Meeting(from: $0) }
            .sorted { $0.startDate < $1.startDate }
    }
    
    func refreshMeetings() async {
        await loadUpcomingMeetings()
    }
}