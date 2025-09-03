import SwiftUI
import SwiftData

struct RecordingView: View {
    @StateObject private var audioService = AudioRecordingService()
    @StateObject private var transcriptionService = TranscriptionService()
    @StateObject private var summaryService = AISummaryService()
    @Environment(\.modelContext) private var modelContext
    
    @State private var selectedMeeting: Meeting?
    @State private var showingMeetingPicker = false
    @State private var currentRecordingURL: URL?
    @State private var showingTranscriptionView = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 30) {
                if let meeting = selectedMeeting {
                    SelectedMeetingView(meeting: meeting) {
                        selectedMeeting = nil
                    }
                } else {
                    SelectMeetingPrompt {
                        showingMeetingPicker = true
                    }
                }
                
                RecordingControlsView(
                    isRecording: audioService.isRecording,
                    duration: audioService.recordingDuration,
                    level: audioService.recordingLevel,
                    canRecord: selectedMeeting != nil && audioService.authorizationStatus == .granted
                ) {
                    await startRecording()
                } stopAction: {
                    stopRecording()
                }
                
                if audioService.authorizationStatus != .granted {
                    PermissionBannerView(
                        icon: "mic",
                        title: "Microphone Access Required",
                        message: "Grant microphone access to record meetings",
                        buttonTitle: "Grant Access"
                    ) {
                        Task {
                            await audioService.requestRecordingPermission()
                        }
                    }
                }
                
                Spacer()
            }
            .padding()
            .navigationTitle("Record Meeting")
            .sheet(isPresented: $showingMeetingPicker) {
                MeetingPickerView(selectedMeeting: $selectedMeeting)
            }
            .sheet(isPresented: $showingTranscriptionView) {
                if let meeting = selectedMeeting {
                    TranscriptionProcessingView(
                        meeting: meeting,
                        audioURL: currentRecordingURL
                    )
                }
            }
        }
    }
    
    private func startRecording() async {
        guard let meeting = selectedMeeting else { return }
        
        currentRecordingURL = await audioService.startRecording(for: meeting)
        
        if currentRecordingURL != nil {
            modelContext.insert(meeting)
            try? modelContext.save()
        }
    }
    
    private func stopRecording() {
        audioService.stopRecording()
        showingTranscriptionView = true
    }
}

struct SelectedMeetingView: View {
    let meeting: Meeting
    let onRemove: () -> Void
    
    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Text("Selected Meeting")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Spacer()
                Button("Change", action: onRemove)
                    .font(.caption)
            }
            
            VStack(alignment: .leading, spacing: 8) {
                Text(meeting.title)
                    .font(.title2)
                    .fontWeight(.semibold)
                
                HStack {
                    Label(meeting.startDate.formatted(date: .abbreviated, time: .shortened), systemImage: "clock")
                    Spacer()
                    if let location = meeting.location {
                        Label(location, systemImage: "location")
                    }
                }
                .font(.subheadline)
                .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }
}

struct SelectMeetingPrompt: View {
    let action: () -> Void
    
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "calendar.badge.plus")
                .font(.system(size: 48))
                .foregroundColor(.blue)
            
            Text("Select a Meeting to Record")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text("Choose from your calendar or create a new meeting")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            Button("Select Meeting") {
                action()
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
    }
}

struct RecordingControlsView: View {
    let isRecording: Bool
    let duration: TimeInterval
    let level: Float
    let canRecord: Bool
    let startAction: () async -> Void
    let stopAction: () -> Void
    
    var body: some View {
        VStack(spacing: 20) {
            if isRecording {
                VStack(spacing: 16) {
                    Text("Recording...")
                        .font(.headline)
                        .foregroundColor(.red)
                    
                    Text(formatDuration(duration))
                        .font(.title)
                        .fontWeight(.semibold)
                        .monospacedDigit()
                    
                    AudioLevelView(level: level)
                }
            }
            
            HStack(spacing: 40) {
                if isRecording {
                    Button(action: stopAction) {
                        Image(systemName: "stop.fill")
                            .font(.title)
                            .frame(width: 80, height: 80)
                            .background(Color.red)
                            .foregroundColor(.white)
                            .clipShape(Circle())
                    }
                } else {
                    Button {
                        Task {
                            await startAction()
                        }
                    } label: {
                        Image(systemName: "record.circle")
                            .font(.title)
                            .frame(width: 80, height: 80)
                            .background(canRecord ? Color.red : Color.gray)
                            .foregroundColor(.white)
                            .clipShape(Circle())
                    }
                    .disabled(!canRecord)
                }
            }
        }
    }
    
    private func formatDuration(_ duration: TimeInterval) -> String {
        let minutes = Int(duration) / 60
        let seconds = Int(duration) % 60
        return String(format: "%02d:%02d", minutes, seconds)
    }
}

struct AudioLevelView: View {
    let level: Float
    
    var body: some View {
        HStack(spacing: 2) {
            ForEach(0..<20, id: \.self) { index in
                RoundedRectangle(cornerRadius: 1)
                    .fill(level > Float(index) / 20.0 ? Color.green : Color.gray.opacity(0.3))
                    .frame(width: 3, height: CGFloat(8 + index))
            }
        }
        .frame(height: 30)
    }
}

#Preview {
    RecordingView()
        .modelContainer(for: [Meeting.self, Transcript.self])
}