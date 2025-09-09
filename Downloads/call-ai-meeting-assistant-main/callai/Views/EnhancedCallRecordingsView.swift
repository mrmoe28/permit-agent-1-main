import SwiftUI

struct EnhancedCallRecordingsView: View {
    @StateObject private var meetingViewModel = MeetingViewModel()
    let onBackToLanding: () -> Void
    
    var body: some View {
        NavigationView {
            VStack {
                if meetingViewModel.isLoading {
                    ProgressView("Loading recordings...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if meetingViewModel.meetingsWithRecordings.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "mic.circle")
                            .font(.system(size: 60))
                            .foregroundColor(.secondary)
                        
                        Text("No Recordings")
                            .font(.title2)
                            .fontWeight(.semibold)
                        
                        Text("Your call recordings will appear here")
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    List(meetingViewModel.meetingsWithRecordings) { meeting in
                        RecordingRowView(meeting: meeting)
                    }
                }
            }
            .navigationTitle("Recordings")
            .onAppear {
                Task {
                    await meetingViewModel.loadMeetings()
                }
            }
        }
    }
}

struct RecordingRowView: View {
    let meeting: Meeting
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(meeting.title)
                    .font(.headline)
                
                Spacer()
                
                Image(systemName: "mic.fill")
                    .foregroundColor(.red)
            }
            
            HStack {
                Image(systemName: "clock")
                    .foregroundColor(.secondary)
                Text(meeting.formattedDuration)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text(meeting.startDate, format: .dateTime.month().day().year())
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