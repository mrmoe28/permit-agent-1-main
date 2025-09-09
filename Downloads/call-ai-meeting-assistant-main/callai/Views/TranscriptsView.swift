import SwiftUI

struct TranscriptsView: View {
    @StateObject private var meetingViewModel = MeetingViewModel()
    let onBackToLanding: () -> Void
    
    var body: some View {
        NavigationView {
            VStack {
                if meetingViewModel.isLoading {
                    ProgressView("Loading transcripts...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if meetingViewModel.meetingsWithTranscripts.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "doc.text.magnifyingglass")
                            .font(.system(size: 60))
                            .foregroundColor(.secondary)
                        
                        Text("No Transcripts")
                            .font(.title2)
                            .fontWeight(.semibold)
                        
                        Text("Transcripts from your meetings will appear here")
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    List(meetingViewModel.meetingsWithTranscripts) { meeting in
                        if let transcript = meeting.transcript {
                            TranscriptRowView(meeting: meeting, transcript: transcript)
                        }
                    }
                }
            }
            .navigationTitle("Transcripts")
            .onAppear {
                Task {
                    await meetingViewModel.loadMeetings()
                }
            }
        }
    }
}

struct TranscriptRowView: View {
    let meeting: Meeting
    let transcript: Transcript
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(meeting.title)
                    .font(.headline)
                
                Spacer()
                
                Text(transcript.formattedReadingTime)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Text(transcript.content)
                .font(.body)
                .lineLimit(3)
                .foregroundColor(.secondary)
            
            HStack {
                Text("\(transcript.wordCount) words")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text("\(transcript.confidencePercentage)% confidence")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}
