import SwiftUI
import SwiftData

struct RecordingView: View {
    @StateObject private var audioService = AudioRecordingService()
    @StateObject private var transcriptionService = TranscriptionService()
    @StateObject private var summaryService = AISummaryService()
    @StateObject private var meetingSelectionManager = MeetingSelectionManager.shared
    @Environment(\.modelContext) private var modelContext
    
    @State private var selectedMeeting: Meeting?
    @State private var currentRecordingURL: URL?
    @State private var showingTranscriptionView = false
    
    // Binding to parent tab selection to enable auto-navigation
    @Binding var selectedTab: Int
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Meeting picker at the top
                MeetingSidebar(selectedMeeting: $selectedMeeting, selectedTab: $selectedTab)
                    .frame(height: 120)
                    .background(Color.secondary.opacity(0.1))
                
                // Main content area
                ScrollView {
                    LazyVStack(spacing: 32) {
                        if let meeting = selectedMeeting {
                            SelectedMeetingView(meeting: meeting) {
                                selectedMeeting = nil
                            }
                            .transition(.asymmetric(
                                insertion: .scale.combined(with: .opacity),
                                removal: .scale.combined(with: .opacity)
                            ))
                        } else {
                            SelectMeetingPrompt()
                            .transition(.asymmetric(
                                insertion: .scale.combined(with: .opacity),
                                removal: .scale.combined(with: .opacity)
                            ))
                        }
                        
                        RecordingControlsView(
                            isRecording: audioService.isRecording,
                            duration: audioService.recordingDuration,
                            level: audioService.recordingLevel,
                            canRecord: selectedMeeting != nil && checkRecordingPermission()
                        ) {
                            await startRecording()
                        } stopAction: {
                            stopRecording()
                        }
                        
                        if !checkRecordingPermission() {
                            ModernPermissionBanner(
                                icon: "mic.fill",
                                title: "Microphone Access Required",
                                message: "Grant microphone access to record high-quality meeting audio",
                                buttonTitle: "Enable Microphone"
                            ) {
                                Task {
                                    await audioService.requestRecordingPermission()
                                }
                            }
                            .transition(.move(edge: .bottom).combined(with: .opacity))
                        }
                    }
                    .padding(20)
                }
                .scrollContentBackground(.hidden)
                .background(.regularMaterial)
            }
            .navigationTitle("Record Meeting")
            .animation(.spring(response: 0.6, dampingFraction: 0.8), value: selectedMeeting != nil)
            .animation(.spring(response: 0.6, dampingFraction: 0.8), value: checkRecordingPermission())
            .onAppear {
                // Request microphone permission on appear
                if audioService.authorizationStatus == RecordingPermissionStatus.undetermined {
                    Task {
                        await audioService.requestRecordingPermission()
                    }
                }
                
                // Check for pending meeting from another tab
                if let pendingMeeting = meetingSelectionManager.consumePendingMeeting() {
                    selectedMeeting = pendingMeeting
                }
            }
        }
    }
    
    private func checkRecordingPermission() -> Bool {
        #if os(iOS)
        return audioService.authorizationStatus == RecordingPermissionStatus.granted
        #else
        return audioService.authorizationStatus == .granted
        #endif
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
        
        // Automatically start transcription process
        if let meeting = selectedMeeting, let recordingURL = currentRecordingURL {
            meeting.recordingURL = recordingURL
            meeting.isRecorded = true
            meeting.updatedAt = Date()
            
            // Save the meeting with recording URL
            try? modelContext.save()
            
            // Automatically navigate to Transcripts tab instead of showing modal
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                selectedTab = 2 // Navigate to Transcripts tab
            }
            
            // Start background transcription processing
            Task {
                await startBackgroundTranscription(for: meeting, audioURL: recordingURL)
            }
        }
    }
    
    private func startBackgroundTranscription(for meeting: Meeting, audioURL: URL) async {
        // Check if we have a valid API key for AI features
        guard AppConfig.shared.hasValidOpenAIAPIKey else {
            print("OpenAI API key not configured")
            return
        }
        
        // Start transcription in background
        let transcript = await transcriptionService.transcribeAudio(from: audioURL, for: meeting)
        
        guard let transcript = transcript else {
            print("Transcription failed: \(transcriptionService.errorMessage ?? "Unknown error")")
            return
        }
        
        await MainActor.run {
            modelContext.insert(transcript)
            do {
                try modelContext.save()
            } catch {
                print("Failed to save transcript: \(error.localizedDescription)")
                return
            }
        }
        
        // Generate summary
        let summaryService = AISummaryService(apiKey: AppConfig.shared.openAIAPIKey)
        await summaryService.generateSummary(for: transcript)
        
        await MainActor.run {
            if let errorMsg = summaryService.errorMessage {
                print("Summary generation failed: \(errorMsg)")
                return
            }
            
            do {
                try modelContext.save()
                print("Transcription and summary completed successfully")
            } catch {
                print("Failed to save summary: \(error.localizedDescription)")
            }
        }
    }
}

struct SelectedMeetingView: View {
    let meeting: Meeting
    let onRemove: () -> Void
    
    var body: some View {
        VStack(spacing: 16) {
            HStack {
                Text("Selected Meeting")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundStyle(.secondary)
                    .textCase(.uppercase)
                    .tracking(0.5)
                Spacer()
                Button("Change", action: onRemove)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundStyle(.blue)
            }
            
            VStack(alignment: .leading, spacing: 12) {
                Text(meeting.title)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundStyle(.primary)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                    .shadow(color: .black.opacity(0.1), radius: 1, x: 0, y: 1)
                
                HStack(spacing: 16) {
                    Label {
                        Text(meeting.startDate.formatted(date: .abbreviated, time: .shortened))
                            .fontWeight(.semibold)
                    } icon: {
                        Image(systemName: "clock.fill")
                            .foregroundStyle(.blue)
                    }
                    
                    Spacer()
                    
                    if let location = meeting.location, !location.isEmpty {
                        Label {
                            Text(location)
                                .fontWeight(.semibold)
                        } icon: {
                            Image(systemName: "location.fill")
                                .foregroundStyle(.orange)
                        }
                    }
                }
                .font(.subheadline)
                .foregroundStyle(.primary)
            }
        }
        .padding(24)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 20))
        .overlay {
            RoundedRectangle(cornerRadius: 20)
                .stroke(.quaternary.opacity(0.5), lineWidth: 1)
        }
        .shadow(color: .black.opacity(0.12), radius: 12, x: 0, y: 4)
        .overlay {
            RoundedRectangle(cornerRadius: 20)
                .fill(.ultraThinMaterial.opacity(0.5))
                .blendMode(.overlay)
        }
    }
}

struct SelectMeetingPrompt: View {
    var body: some View {
        VStack(spacing: 24) {
            VStack(spacing: 16) {
                Image(systemName: "arrow.left")
                    .font(.system(size: 48, weight: .light))
                    .foregroundStyle(.blue)
                    .symbolEffect(.pulse.byLayer, options: .repeating)
                
                VStack(spacing: 8) {
                    Text("Select a Meeting from the Sidebar")
                        .font(.title2)
                        .fontWeight(.semibold)
                        .foregroundStyle(.primary)
                    
                    Text("Choose from your calendar meetings or create a new custom meeting in the left panel")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .lineLimit(3)
                }
            }
        }
        .padding(32)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 20))
        .overlay {
            RoundedRectangle(cornerRadius: 20)
                .stroke(.quaternary, lineWidth: 1)
        }
    }
}

struct RecordingControlsView: View {
    let isRecording: Bool
    let duration: TimeInterval
    let level: Float
    let canRecord: Bool
    let startAction: () async -> Void
    let stopAction: () -> Void
    
    private var shadowColor: Color {
        canRecord ? .red.opacity(0.3) : .gray.opacity(0.3)
    }
    
    var body: some View {
        VStack(spacing: 32) {
            if isRecording {
                VStack(spacing: 20) {
                    HStack(spacing: 8) {
                        Circle()
                            .fill(.red)
                            .frame(width: 8, height: 8)
                            .scaleEffect(isRecording ? 1.0 : 0.5)
                            .animation(.easeInOut(duration: 1).repeatForever(), value: isRecording)
                        
                        Text("Recording")
                            .font(.headline)
                            .fontWeight(.semibold)
                            .foregroundStyle(.red)
                    }
                    
                    Text(formatDuration(duration))
                        .font(.system(.largeTitle, design: .monospaced))
                        .fontWeight(.medium)
                        .foregroundStyle(.primary)
                    
                    AudioLevelView(level: level)
                }
                .padding(24)
                .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 20))
                .overlay {
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(.quaternary, lineWidth: 1)
                }
            }
            
            HStack(spacing: 40) {
                if isRecording {
                    Button(action: stopAction) {
                        Image(systemName: "stop.fill")
                            .font(.system(size: 32, weight: .medium))
                            .frame(width: 90, height: 90)
                            .background(.red, in: Circle())
                            .foregroundStyle(.white)
                            .shadow(color: .red.opacity(0.3), radius: 8, x: 0, y: 4)
                    }
                    .scaleEffect(1.0)
                    .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isRecording)
                } else {
                    Button {
                        Task {
                            await startAction()
                        }
                    } label: {
                        Image(systemName: canRecord ? "record.circle" : "record.circle")
                            .font(.system(size: 32, weight: .medium))
                            .frame(width: 90, height: 90)
                            .background(canRecord ? .red : .gray, in: Circle())
                            .foregroundStyle(.white)
                            .shadow(color: shadowColor, radius: 8, x: 0, y: 4)
                    }
                    .disabled(!canRecord)
                    .scaleEffect(canRecord ? 1.0 : 0.9)
                    .animation(.spring(response: 0.3, dampingFraction: 0.6), value: canRecord)
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
        HStack(spacing: 3) {
            ForEach(0..<25, id: \.self) { index in
                RoundedRectangle(cornerRadius: 2)
                    .fill(barColor(for: index, level: level))
                    .frame(width: 4, height: CGFloat(12 + index * 2))
                    .animation(.easeInOut(duration: 0.1), value: level)
            }
        }
        .frame(height: 60)
    }
    
    private func barColor(for index: Int, level: Float) -> Color {
        let threshold = Float(index) / 25.0
        let isActive = level > threshold
        
        if isActive {
            if threshold < 0.6 {
                return .green
            } else if threshold < 0.8 {
                return .yellow
            } else {
                return .red
            }
        } else {
            return .gray.opacity(0.2)
        }
    }
}

struct ModernPermissionBanner: View {
    let icon: String
    let title: String
    let message: String
    let buttonTitle: String
    let action: () -> Void
    
    var body: some View {
        VStack(spacing: 20) {
            VStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 40, weight: .medium))
                    .foregroundStyle(.orange.gradient)
                    .symbolEffect(.bounce, options: .repeating)
                
                VStack(spacing: 6) {
                    Text(title)
                        .font(.headline)
                        .fontWeight(.semibold)
                        .foregroundStyle(.primary)
                    
                    Text(message)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .lineLimit(3)
                }
            }
            
            Button(action: action) {
                HStack(spacing: 8) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 16, weight: .semibold))
                    Text(buttonTitle)
                        .fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
            }
            .buttonStyle(.borderedProminent)
            .buttonBorderShape(.roundedRectangle(radius: 12))
        }
        .padding(24)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
        .overlay {
            RoundedRectangle(cornerRadius: 16)
                .stroke(.orange.opacity(0.3), lineWidth: 1)
        }
        .shadow(color: .orange.opacity(0.1), radius: 8, x: 0, y: 2)
    }
}

struct MeetingSidebar: View {
    @Binding var selectedMeeting: Meeting?
    @Binding var selectedTab: Int
    @StateObject private var calendarService = CalendarService()
    @State private var showingCustomMeeting = false
    @State private var customMeetingTitle = ""
    @State private var customMeetingDate = Date()
    @State private var customMeetingDuration = 60.0
    @Environment(\.modelContext) private var modelContext
    
    private var meetingSelectorHeader: some View {
        VStack(spacing: 16) {
            Text("Select Meeting")
                .font(.title2)
                .fontWeight(.bold)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            Button {
                showingCustomMeeting = true
            } label: {
                HStack {
                    Image(systemName: "plus.circle.fill")
                        .font(.title2)
                    Text("New Meeting")
                        .fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(.blue.gradient)
                .foregroundColor(.white)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 16)
        .padding(.top, 20)
        .padding(.bottom, 16)
    }
    
    private var meetingsList: some View {
        List {
                if calendarService.authorizationStatus != .fullAccess {
                    Section {
                        VStack(spacing: 12) {
                            Image(systemName: "calendar.badge.exclamationmark")
                                .font(.title)
                                .foregroundColor(.orange)
                            
                            Text("Calendar Access Required")
                                .font(.headline)
                                .multilineTextAlignment(.center)
                            
                            Text("Grant access to see your upcoming meetings")
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                            
                            Button("Grant Access") {
                                Task {
                                    await calendarService.requestCalendarAccess()
                                }
                            }
                            .buttonStyle(.borderedProminent)
                            .controlSize(.small)
                        }
                        .padding()
                        .listRowInsets(EdgeInsets())
                    }
                }
                
                if !calendarService.meetings.isEmpty {
                    Section("Upcoming Meetings") {
                        ForEach(calendarService.meetings, id: \.id) { meeting in
                            Button {
                                selectedMeeting = meeting
                            } label: {
                                MeetingRowView(meeting: meeting)
                                    .background(selectedMeeting?.id == meeting.id ? 
                                              Color.blue.opacity(0.1) : Color.clear)
                                    .clipShape(RoundedRectangle(cornerRadius: 8))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                
                if calendarService.meetings.isEmpty && calendarService.authorizationStatus == .fullAccess {
                    Section {
                        VStack(spacing: 8) {
                            Image(systemName: "calendar")
                                .font(.title2)
                                .foregroundColor(.secondary)
                            Text("No upcoming meetings")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .listRowInsets(EdgeInsets())
                    }
                }
            }
            .listStyle(.sidebar)
            .scrollContentBackground(.hidden)
    }
    
    var body: some View {
        VStack(spacing: 0) {
            meetingSelectorHeader
            
            Divider()
            
            meetingsList
        }
        .background(Color.secondary.opacity(0.1))
        .onAppear {
            if calendarService.authorizationStatus == .fullAccess {
                Task {
                    await calendarService.loadUpcomingMeetings()
                }
            }
        }
        .sheet(isPresented: $showingCustomMeeting) {
            CustomMeetingView(
                title: $customMeetingTitle,
                date: $customMeetingDate,
                duration: $customMeetingDuration
            ) { meeting in
                // Save the meeting to the database
                modelContext.insert(meeting)
                try? modelContext.save()
                
                // Select the meeting for recording
                selectedMeeting = meeting
                
                // Clear form fields and dismiss sheet
                customMeetingTitle = ""
                customMeetingDate = Date()
                customMeetingDuration = 60.0
                showingCustomMeeting = false
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .presentationDetents([.height(500)])
            .presentationDragIndicator(.hidden)
        }
    }
}

#Preview {
    RecordingView(selectedTab: .constant(1))
        .modelContainer(for: [Meeting.self, Transcript.self])
}