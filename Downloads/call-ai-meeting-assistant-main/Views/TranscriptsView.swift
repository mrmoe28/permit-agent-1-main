import SwiftUI
import SwiftData

struct TranscriptsView: View {
    @Query(sort: \Transcript.createdAt, order: .reverse) private var transcripts: [Transcript]
    
    var body: some View {
        NavigationView {
            List {
                if transcripts.isEmpty {
                    ContentUnavailableView(
                        "No Transcripts Yet",
                        systemImage: "doc.text",
                        description: Text("Your meeting transcripts will appear here after recording")
                    )
                } else {
                    ForEach(transcripts, id: \.id) { transcript in
                        NavigationLink(destination: TranscriptDetailView(transcript: transcript)) {
                            TranscriptRowView(transcript: transcript)
                        }
                    }
                }
            }
            .navigationTitle("Transcripts")
        }
    }
}

struct TranscriptRowView: View {
    let transcript: Transcript
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(transcript.meeting?.title ?? "Untitled Meeting")
                    .font(.headline)
                    .lineLimit(1)
                
                Spacer()
                
                Text(transcript.createdAt, style: .date)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            if let summary = transcript.summary, !summary.isEmpty {
                Text(summary)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            } else {
                Text(transcript.content)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }
            
            HStack {
                Label("\(transcript.wordCount) words", systemImage: "doc.text")
                
                Spacer()
                
                Label("\(transcript.estimatedReadingTime) min read", systemImage: "clock")
                
                if transcript.confidence > 0 {
                    Label("\(Int(transcript.confidence * 100))%", systemImage: "checkmark.circle")
                        .foregroundColor(transcript.confidence > 0.8 ? .green : .orange)
                }
            }
            .font(.caption)
            .foregroundColor(.secondary)
        }
        .padding(.vertical, 4)
    }
}

struct TranscriptDetailView: View {
    let transcript: Transcript
    @StateObject private var summaryService = AISummaryService()
    @State private var showingSummary = true
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HeaderView(transcript: transcript)
                
                if let summary = transcript.summary, !summary.isEmpty {
                    SummarySection(
                        transcript: transcript,
                        showingSummary: $showingSummary
                    )
                }
                
                TranscriptContentSection(transcript: transcript)
                
                if transcript.summary?.isEmpty != false {
                    GenerateSummarySection(
                        transcript: transcript,
                        summaryService: summaryService
                    )
                }
            }
            .padding()
        }
        .navigationTitle("Transcript")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct HeaderView: View {
    let transcript: Transcript
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(transcript.meeting?.title ?? "Untitled Meeting")
                .font(.title2)
                .fontWeight(.bold)
            
            Text(transcript.createdAt.formatted(date: .abbreviated, time: .shortened))
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            HStack {
                Label("\(transcript.wordCount) words", systemImage: "doc.text")
                Label("\(transcript.estimatedReadingTime) min", systemImage: "clock")
                
                if transcript.confidence > 0 {
                    Label("\(Int(transcript.confidence * 100))% accurate", systemImage: "checkmark.circle")
                        .foregroundColor(transcript.confidence > 0.8 ? .green : .orange)
                }
            }
            .font(.caption)
            .foregroundColor(.secondary)
        }
    }
}

struct SummarySection: View {
    let transcript: Transcript
    @Binding var showingSummary: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("AI Summary")
                    .font(.headline)
                Spacer()
                Button(showingSummary ? "Show Transcript" : "Show Summary") {
                    showingSummary.toggle()
                }
                .font(.subheadline)
            }
            
            if showingSummary {
                if let summary = transcript.summary, !summary.isEmpty {
                    Text(summary)
                        .font(.body)
                }
                
                if !transcript.keyPoints.isEmpty {
                    Text("Key Points")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .padding(.top)
                    
                    ForEach(transcript.keyPoints, id: \.self) { point in
                        Text("• \(point)")
                            .font(.body)
                    }
                }
                
                if !transcript.actionItems.isEmpty {
                    Text("Action Items")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .padding(.top)
                    
                    ForEach(transcript.actionItems, id: \.self) { item in
                        Text("□ \(item)")
                            .font(.body)
                    }
                }
                
                if !transcript.participants.isEmpty {
                    Text("Participants")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .padding(.top)
                    
                    Text(transcript.participants.joined(separator: ", "))
                        .font(.body)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }
}

struct TranscriptContentSection: View {
    let transcript: Transcript
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Transcript")
                .font(.headline)
            
            Text(transcript.content)
                .font(.body)
                .textSelection(.enabled)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }
}

struct GenerateSummarySection: View {
    let transcript: Transcript
    @ObservedObject var summaryService: AISummaryService
    
    var body: some View {
        VStack(spacing: 12) {
            if summaryService.isGeneratingSummary {
                ProgressView("Generating AI Summary...")
                    .frame(maxWidth: .infinity)
            } else {
                Button("Generate AI Summary") {
                    Task {
                        await summaryService.generateSummary(for: transcript)
                    }
                }
                .buttonStyle(.borderedProminent)
                .frame(maxWidth: .infinity)
            }
            
            if let error = summaryService.errorMessage {
                Text(error)
                    .font(.caption)
                    .foregroundColor(.red)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }
}

#Preview {
    TranscriptsView()
        .modelContainer(for: [Meeting.self, Transcript.self])
}