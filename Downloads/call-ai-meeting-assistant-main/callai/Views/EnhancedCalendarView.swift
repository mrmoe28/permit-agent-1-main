import SwiftUI

struct EnhancedCalendarView: View {
    @StateObject private var meetingViewModel = MeetingViewModel()
    let onBackToLanding: () -> Void
    
    var body: some View {
        NavigationView {
            VStack {
                if meetingViewModel.isLoading {
                    ProgressView("Loading calendar...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if meetingViewModel.meetings.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "calendar.badge.plus")
                            .font(.system(size: 60))
                            .foregroundColor(.secondary)
                        
                        Text("No Events")
                            .font(.title2)
                            .fontWeight(.semibold)
                        
                        Text("Your calendar events will appear here")
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    List(meetingViewModel.meetings) { meeting in
                        CalendarEventRowView(meeting: meeting)
                    }
                }
            }
            .navigationTitle("Calendar")
            .onAppear {
                Task {
                    await meetingViewModel.loadMeetings()
                }
            }
        }
    }
}

struct CalendarEventRowView: View {
    let meeting: Meeting
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(meeting.title)
                    .font(.headline)
                
                Spacer()
                
                Text(meeting.startDate, format: .dateTime.hour().minute())
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            HStack {
                Image(systemName: "clock")
                    .foregroundColor(.secondary)
                Text(meeting.formattedDuration)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text(meeting.startDate, format: .dateTime.month().day())
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            if !meeting.participants.isEmpty {
                HStack {
                    Image(systemName: "person.2.fill")
                        .foregroundColor(.secondary)
                    Text(meeting.participants.joined(separator: ", "))
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
            }
        }
        .padding(.vertical, 4)
    }
}