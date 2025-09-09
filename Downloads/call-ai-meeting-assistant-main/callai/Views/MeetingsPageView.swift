import SwiftUI

struct MeetingsPageView: View {
    @StateObject private var meetingViewModel = MeetingViewModel()
    @Binding var selectedTab: Int
    let onBackToLanding: () -> Void
    
    var body: some View {
        NavigationView {
            VStack {
                if meetingViewModel.isLoading {
                    ProgressView("Loading meetings...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if meetingViewModel.meetings.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "calendar.badge.plus")
                            .font(.system(size: 60))
                            .foregroundColor(.secondary)
                        
                        Text("No Meetings")
                            .font(.title2)
                            .fontWeight(.semibold)
                        
                        Text("Your upcoming meetings will appear here")
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                        
                        Button("Add Meeting") {
                            // TODO: Implement add meeting
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    List(meetingViewModel.meetings) { meeting in
                        MeetingRowView(meeting: meeting)
                    }
                }
            }
            .navigationTitle("Meetings")
            .onAppear {
                Task {
                    await meetingViewModel.loadMeetings()
                }
            }
        }
    }
}

struct MeetingRowView: View {
    let meeting: Meeting
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(meeting.title)
                    .font(.headline)
                
                Spacer()
                
                if meeting.isInProgress {
                    Text("Live")
                        .font(.caption)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.red)
                        .foregroundColor(.white)
                        .clipShape(Capsule())
                }
            }
            
            HStack {
                Image(systemName: "clock")
                    .foregroundColor(.secondary)
                Text(meeting.startDate, format: .dateTime.hour().minute())
                    .foregroundColor(.secondary)
                
                Spacer()
                
                if meeting.hasRecording {
                    Image(systemName: "mic.fill")
                        .foregroundColor(.blue)
                }
                
                if meeting.hasTranscript {
                    Image(systemName: "doc.text.fill")
                        .foregroundColor(.green)
                }
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