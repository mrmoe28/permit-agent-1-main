import SwiftUI
import AVFoundation

struct MeetingDetailView: View {
    let meeting: Meeting
    @State private var audioPlayer: AVAudioPlayer?
    @State private var isPlaying = false
    @State private var playbackPosition: TimeInterval = 0
    @State private var playbackTimer: Timer?
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                MeetingHeaderView(meeting: meeting)
                
                if let recordingURL = meeting.recordingURL {
                    AudioPlayerView(
                        audioURL: recordingURL,
                        isPlaying: $isPlaying,
                        playbackPosition: $playbackPosition,
                        audioPlayer: $audioPlayer,
                        playbackTimer: $playbackTimer
                    )
                }
                
                if let transcript = meeting.transcript {
                    NavigationLink(destination: TranscriptDetailView(transcript: transcript)) {
                        TranscriptSummaryView(transcript: transcript)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding()
        }
        .navigationTitle(meeting.title)
        
        .onDisappear {
            stopPlayback()
        }
    }
    
    private func stopPlayback() {
        audioPlayer?.stop()
        playbackTimer?.invalidate()
        playbackTimer = nil
        isPlaying = false
    }
}

struct MeetingHeaderView: View {
    let meeting: Meeting
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading) {
                    Text(meeting.startDate.formatted(date: .abbreviated, time: .shortened))
                        .font(.headline)
                    
                    Text("Duration: \(formatDuration(meeting.duration))")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                VStack {
                    Image(systemName: meeting.isRecorded ? "checkmark.circle.fill" : "clock")
                        .font(.title2)
                        .foregroundColor(meeting.isRecorded ? .green : .orange)
                    
                    Text(meeting.isRecorded ? "Recorded" : "Scheduled")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            if let location = meeting.location, !location.isEmpty {
                Label(location, systemImage: "location")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(12)
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

struct AudioPlayerView: View {
    let audioURL: URL
    @Binding var isPlaying: Bool
    @Binding var playbackPosition: TimeInterval
    @Binding var audioPlayer: AVAudioPlayer?
    @Binding var playbackTimer: Timer?
    
    @State private var duration: TimeInterval = 0
    
    var body: some View {
        VStack(spacing: 16) {
            Text("Recording")
                .font(.headline)
            
            VStack(spacing: 12) {
                HStack {
                    Text(formatTime(playbackPosition))
                        .font(.caption)
                        .monospacedDigit()
                    
                    Spacer()
                    
                    Text(formatTime(duration))
                        .font(.caption)
                        .monospacedDigit()
                }
                .foregroundColor(.secondary)
                
                if duration > 0 {
                    ProgressView(value: playbackPosition, total: duration)
                        .progressViewStyle(.linear)
                }
                
                HStack(spacing: 40) {
                    Button {
                        seek(by: -15)
                    } label: {
                        Image(systemName: "gobackward.15")
                            .font(.title2)
                    }
                    .disabled(audioPlayer == nil)
                    
                    Button {
                        if isPlaying {
                            pausePlayback()
                        } else {
                            startPlayback()
                        }
                    } label: {
                        Image(systemName: isPlaying ? "pause.circle.fill" : "play.circle.fill")
                            .font(.largeTitle)
                    }
                    
                    Button {
                        seek(by: 30)
                    } label: {
                        Image(systemName: "goforward.30")
                            .font(.title2)
                    }
                    .disabled(audioPlayer == nil)
                }
            }
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(12)
        .onAppear {
            setupAudioPlayer()
        }
    }
    
    private func setupAudioPlayer() {
        do {
            audioPlayer = try AVAudioPlayer(contentsOf: audioURL)
            audioPlayer?.prepareToPlay()
            duration = audioPlayer?.duration ?? 0
        } catch {
            print("Failed to setup audio player: \(error)")
        }
    }
    
    private func startPlayback() {
        audioPlayer?.play()
        isPlaying = true
        startTimer()
    }
    
    private func pausePlayback() {
        audioPlayer?.pause()
        isPlaying = false
        playbackTimer?.invalidate()
        playbackTimer = nil
    }
    
    private func startTimer() {
        playbackTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { _ in
            playbackPosition = audioPlayer?.currentTime ?? 0
            
            if !(audioPlayer?.isPlaying ?? false) {
                isPlaying = false
                playbackTimer?.invalidate()
                playbackTimer = nil
            }
        }
    }
    
    private func seek(by seconds: TimeInterval) {
        guard let player = audioPlayer else { return }
        
        let newTime = max(0, min(player.currentTime + seconds, duration))
        player.currentTime = newTime
        playbackPosition = newTime
    }
    
    private func formatTime(_ time: TimeInterval) -> String {
        let minutes = Int(time) / 60
        let seconds = Int(time) % 60
        return String(format: "%02d:%02d", minutes, seconds)
    }
}

struct TranscriptSummaryView: View {
    let transcript: Transcript
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Transcript")
                    .font(.headline)
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            if let summary = transcript.summary, !summary.isEmpty {
                Text(summary)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(3)
            } else {
                Text(transcript.content)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(3)
            }
            
            HStack {
                Label("\(transcript.wordCount) words", systemImage: "doc.text")
                
                Spacer()
                
                if transcript.confidence > 0 {
                    Label("\(Int(transcript.confidence * 100))% accurate", systemImage: "checkmark.circle")
                        .foregroundColor(transcript.confidence > 0.8 ? .green : .orange)
                }
            }
            .font(.caption)
            .foregroundColor(.secondary)
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(12)
    }
}

#Preview {
    NavigationView {
        MeetingDetailView(
            meeting: Meeting(
                title: "Weekly Team Standup",
                startDate: Date().addingTimeInterval(-3600),
                endDate: Date(),
                participants: []
            )
        )
    }
}