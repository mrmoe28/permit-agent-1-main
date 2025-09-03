import SwiftUI
import SwiftData

struct MeetingsListView: View {
    @StateObject private var calendarService = CalendarService()
    @Query private var storedMeetings: [Meeting]
    @State private var showingPermissionAlert = false
    
    var body: some View {
        NavigationView {
            List {
                if calendarService.authorizationStatus != .fullAccess {
                    PermissionBannerView(
                        icon: "calendar",
                        title: "Calendar Access Required",
                        message: "Grant calendar access to view your upcoming meetings",
                        buttonTitle: "Grant Access"
                    ) {
                        Task {
                            await calendarService.requestCalendarAccess()
                        }
                    }
                }
                
                if !calendarService.meetings.isEmpty {
                    Section("Upcoming Meetings") {
                        ForEach(calendarService.meetings, id: \.id) { meeting in
                            MeetingRowView(meeting: meeting)
                        }
                    }
                }
                
                if !storedMeetings.isEmpty {
                    Section("Recorded Meetings") {
                        ForEach(storedMeetings.filter { $0.isRecorded }, id: \.id) { meeting in
                            NavigationLink(destination: MeetingDetailView(meeting: meeting)) {
                                MeetingRowView(meeting: meeting)
                            }
                        }
                    }
                }
                
                if calendarService.meetings.isEmpty && storedMeetings.isEmpty {
                    ContentUnavailableView(
                        "No Meetings Found",
                        systemImage: "calendar.badge.exclamationmark",
                        description: Text("Your upcoming meetings will appear here")
                    )
                }
            }
            .navigationTitle("Meetings")
            .refreshable {
                await calendarService.refreshMeetings()
            }
            .onAppear {
                if calendarService.authorizationStatus == .fullAccess {
                    Task {
                        await calendarService.loadUpcomingMeetings()
                    }
                }
            }
        }
    }
}

struct MeetingRowView: View {
    let meeting: Meeting
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 6) {
                Text(meeting.title)
                    .font(.headline)
                    .fontWeight(.semibold)
                    .lineLimit(2)
                
                Text(meeting.startDate, style: .date)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.secondary)
                
                Text("\(meeting.startDate.formatted(date: .omitted, time: .shortened)) - \(meeting.endDate.formatted(date: .omitted, time: .shortened))")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.secondary)
                
                if let location = meeting.location, !location.isEmpty {
                    Label(location, systemImage: "location")
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            VStack {
                if meeting.isRecorded {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                } else if meeting.isInProgress {
                    Image(systemName: "record.circle")
                        .foregroundColor(.red)
                        .symbolEffect(.pulse)
                } else if meeting.isUpcoming {
                    Image(systemName: "clock")
                        .foregroundColor(.orange)
                }
                
                Text(formatDuration(meeting.duration))
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 8)
    }
    
    private func formatDuration(_ duration: TimeInterval) -> String {
        let hours = Int(duration) / 3600
        let minutes = (Int(duration) % 3600) / 60
        
        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }
}

struct PermissionBannerView: View {
    let icon: String
    let title: String
    let message: String
    let buttonTitle: String
    let action: () -> Void
    
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: icon)
                .font(.largeTitle)
                .foregroundColor(.blue)
            
            VStack(spacing: 4) {
                Text(title)
                    .font(.headline)
                Text(message)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            Button(buttonTitle) {
                action()
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
        .listRowInsets(EdgeInsets())
        .listRowBackground(Color.clear)
    }
}

#Preview {
    MeetingsListView()
        .modelContainer(for: [Meeting.self, Transcript.self])
}