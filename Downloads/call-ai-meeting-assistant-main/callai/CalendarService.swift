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
        // Immediately request access if not determined
        if authorizationStatus == .notDetermined {
            Task {
                await requestCalendarAccess()
            }
        }
    }
    
    func checkAuthorizationStatus() {
        authorizationStatus = EKEventStore.authorizationStatus(for: .event)
    }
    
    func requestCalendarAccess() async {
        // Force the permission dialog to appear
        print("Requesting calendar access...")
        
        // Log the request
        PermissionDebugService.shared.log(
            type: .calendar,
            action: "Permission Request",
            result: "Initiated",
            details: "Requesting calendar access via EKEventStore"
        )
        
        do {
            // For macOS 14+ (Sonoma), use requestFullAccessToEvents
            if #available(macOS 14.0, *) {
                let granted = try await eventStore.requestFullAccessToEvents()
                authorizationStatus = granted ? .fullAccess : .denied
                
                if granted {
                    print("Calendar access granted")
                    PermissionDebugService.shared.log(
                        type: .calendar,
                        action: "Permission Response",
                        result: "Granted ✅",
                        details: "Full calendar access granted"
                    )
                    await loadUpcomingMeetings()
                } else {
                    print("Calendar access denied")
                    PermissionDebugService.shared.log(
                        type: .calendar,
                        action: "Permission Response",
                        result: "Denied ❌",
                        details: "User denied calendar access"
                    )
                    errorMessage = """
                    Calendar access was denied.
                    
                    To enable calendar access:
                    1. Open System Settings
                    2. Go to Privacy & Security → Calendar
                    3. Find CallAI and toggle it ON
                    4. Restart the app
                    """
                }
            } else {
                // For older macOS versions
                let granted = try await eventStore.requestAccess(to: .event)
                authorizationStatus = granted ? .fullAccess : .denied
                
                if granted {
                    await loadUpcomingMeetings()
                }
            }
        } catch {
            print("Error requesting calendar access: \(error)")
            errorMessage = """
            Could not request calendar access.
            
            Please grant access manually:
            1. Open System Settings
            2. Go to Privacy & Security → Calendar
            3. Enable access for CallAI
            4. Restart the app
            
            Error: \(error.localizedDescription)
            """
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