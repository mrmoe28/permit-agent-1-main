import SwiftUI
import SwiftData

struct TranscriptionProcessingView: View {
    let meeting: Meeting
    let audioURL: URL?
    
    @StateObject private var transcriptionService = TranscriptionService()
    @StateObject private var summaryService: AISummaryService = {
        AISummaryService(apiKey: AppConfig.shared.openAIAPIKey)
    }()
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext
    
    @State private var currentStep: ProcessingStep = .transcribing
    @State private var generatedTranscript: Transcript?
    
    enum ProcessingStep {
        case transcribing
        case generatingSummary
        case completed
        case error(String)
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 30) {
                ProcessingHeaderView(step: currentStep)
                
                ProcessingProgressView(
                    step: currentStep,
                    transcriptionProgress: transcriptionService.transcriptionProgress,
                    isGeneratingSummary: summaryService.isGeneratingSummary
                )
                
                if case .error(let message) = currentStep {
                    ErrorView(message: message) {
                        startProcessing()
                    }
                }
                
                if case .completed = currentStep {
                    CompletedView {
                        dismiss()
                    }
                }
                
                Spacer()
            }
            .padding()
            .navigationTitle("Processing Recording")
            
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    if case .completed = currentStep {
                        Button("Done") {
                            dismiss()
                        }
                    }
                }
            }
            .onAppear {
                startProcessing()
            }
        }
    }
    
    private func startProcessing() {
        guard let audioURL = audioURL else {
            currentStep = .error("No audio file found")
            return
        }
        
        // Check if we have a valid API key for AI features
        if !AppConfig.shared.hasValidOpenAIAPIKey {
            currentStep = .error("OpenAI API key not configured. Please set your API key in Settings.")
            return
        }
        
        currentStep = .transcribing
        
        Task {
            let transcript = await transcriptionService.transcribeAudio(from: audioURL, for: meeting)
            
            guard let transcript = transcript else {
                await MainActor.run {
                    let errorMsg = transcriptionService.errorMessage ?? "Transcription failed"
                    currentStep = .error(errorMsg)
                }
                return
            }
            
            await MainActor.run {
                generatedTranscript = transcript
                modelContext.insert(transcript)
                do {
                    try modelContext.save()
                    currentStep = .generatingSummary
                } catch {
                    currentStep = .error("Failed to save transcript: \(error.localizedDescription)")
                    return
                }
            }
            
            await summaryService.generateSummary(for: transcript)
            
            await MainActor.run {
                if let errorMsg = summaryService.errorMessage {
                    currentStep = .error("Summary generation failed: \(errorMsg)")
                    return
                }
                
                do {
                    try modelContext.save()
                    currentStep = .completed
                } catch {
                    currentStep = .error("Failed to save summary: \(error.localizedDescription)")
                }
            }
        }
    }
}

struct ProcessingHeaderView: View {
    let step: TranscriptionProcessingView.ProcessingStep
    
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: stepIcon)
                .font(.system(size: 60))
                .foregroundColor(stepColor)
                .symbolEffect(.pulse, isActive: isAnimating)
            
            Text(stepTitle)
                .font(.title2)
                .fontWeight(.semibold)
            
            Text(stepDescription)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
    }
    
    private var stepIcon: String {
        switch step {
        case .transcribing:
            return "waveform.and.mic"
        case .generatingSummary:
            return "brain"
        case .completed:
            return "checkmark.circle.fill"
        case .error:
            return "exclamationmark.triangle.fill"
        }
    }
    
    private var stepColor: Color {
        switch step {
        case .transcribing, .generatingSummary:
            return .blue
        case .completed:
            return .green
        case .error:
            return .red
        }
    }
    
    private var stepTitle: String {
        switch step {
        case .transcribing:
            return "Transcribing Audio"
        case .generatingSummary:
            return "Generating Summary"
        case .completed:
            return "Processing Complete"
        case .error:
            return "Processing Failed"
        }
    }
    
    private var stepDescription: String {
        switch step {
        case .transcribing:
            return "Converting your recording to text using AI speech recognition"
        case .generatingSummary:
            return "Creating an intelligent summary with key points and action items"
        case .completed:
            return "Your meeting has been transcribed and summarized successfully"
        case .error(let message):
            return message
        }
    }
    
    private var isAnimating: Bool {
        switch step {
        case .transcribing, .generatingSummary:
            return true
        case .completed, .error:
            return false
        }
    }
}

struct ProcessingProgressView: View {
    let step: TranscriptionProcessingView.ProcessingStep
    let transcriptionProgress: Double
    let isGeneratingSummary: Bool
    
    var body: some View {
        VStack(spacing: 16) {
            ProgressStep(
                title: "Transcribe Audio",
                isActive: isTranscriptionActive,
                isCompleted: isTranscriptionCompleted,
                progress: transcriptionProgress
            )
            
            ProgressStep(
                title: "Generate AI Summary",
                isActive: isSummaryActive,
                isCompleted: isSummaryCompleted
            )
            
            ProgressStep(
                title: "Save Results",
                isActive: isSaveActive,
                isCompleted: isSaveCompleted
            )
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(12)
    }
    
    private var isTranscriptionActive: Bool {
        if case .transcribing = step { return true }
        return false
    }
    
    private var isTranscriptionCompleted: Bool {
        switch step {
        case .generatingSummary, .completed:
            return true
        default:
            return false
        }
    }
    
    private var isSummaryActive: Bool {
        if case .generatingSummary = step { return true }
        return false
    }
    
    private var isSummaryCompleted: Bool {
        if case .completed = step { return true }
        return false
    }
    
    private var isSaveActive: Bool {
        if case .completed = step { return true }
        return false
    }
    
    private var isSaveCompleted: Bool {
        if case .completed = step { return true }
        return false
    }
}

struct ProgressStep: View {
    let title: String
    let isActive: Bool
    let isCompleted: Bool
    let progress: Double?
    
    init(title: String, isActive: Bool, isCompleted: Bool, progress: Double? = nil) {
        self.title = title
        self.isActive = isActive
        self.isCompleted = isCompleted
        self.progress = progress
    }
    
    var body: some View {
        HStack {
            Group {
                if isCompleted {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                } else if isActive {
                    ProgressView()
                        .scaleEffect(0.8)
                } else {
                    Circle()
                        .stroke(Color.gray, lineWidth: 2)
                        .frame(width: 20, height: 20)
                }
            }
            .frame(width: 24, height: 24)
            
            Text(title)
                .font(.subheadline)
                .fontWeight(isActive ? .semibold : .regular)
            
            Spacer()
            
            if let progress = progress, isActive {
                Text("\(Int(progress * 100))%")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }
}

struct ErrorView: View {
    let message: String
    let onRetry: () -> Void
    
    var body: some View {
        VStack(spacing: 16) {
            Text("Something went wrong")
                .font(.headline)
            
            Text(message)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            Button("Try Again") {
                onRetry()
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(12)
    }
}

struct CompletedView: View {
    let onDismiss: () -> Void
    
    var body: some View {
        VStack(spacing: 16) {
            Text("🎉")
                .font(.system(size: 48))
            
            Text("Processing Complete!")
                .font(.headline)
            
            Text("Your meeting has been transcribed and is ready to view in the Transcripts tab.")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            Button("View Transcripts") {
                onDismiss()
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(12)
    }
}

#Preview {
    TranscriptionProcessingView(
        meeting: Meeting(
            title: "Sample Meeting",
            startDate: Date(),
            endDate: Date().addingTimeInterval(3600),
            participants: []
        ),
        audioURL: nil
    )
    .modelContainer(for: [Meeting.self, Transcript.self])
}