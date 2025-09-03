import Foundation
import SwiftData
import EventKit

@Model
class Meeting {
    var id: UUID
    var title: String
    var startDate: Date
    var endDate: Date
    var location: String?
    var calendarEventID: String?
    var recordingURL: URL?
    var transcript: Transcript?
    var isRecorded: Bool
    var createdAt: Date
    var updatedAt: Date
    
    init(
        title: String,
        startDate: Date,
        endDate: Date,
        location: String? = nil,
        calendarEventID: String? = nil
    ) {
        self.id = UUID()
        self.title = title
        self.startDate = startDate
        self.endDate = endDate
        self.location = location
        self.calendarEventID = calendarEventID
        self.isRecorded = false
        self.createdAt = Date()
        self.updatedAt = Date()
    }
    
    convenience init(from event: EKEvent) {
        self.init(
            title: event.title ?? "Untitled Meeting",
            startDate: event.startDate,
            endDate: event.endDate,
            location: event.location,
            calendarEventID: event.eventIdentifier
        )
    }
    
    var duration: TimeInterval {
        endDate.timeIntervalSince(startDate)
    }
    
    var isUpcoming: Bool {
        startDate > Date()
    }
    
    var isInProgress: Bool {
        let now = Date()
        return startDate <= now && now <= endDate
    }
}