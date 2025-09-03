import Foundation
import SwiftUI
import UniformTypeIdentifiers

@MainActor
class ExportService: ObservableObject {
    @Published var isExporting = false
    @Published var errorMessage: String?
    
    enum ExportFormat: String, CaseIterable {
        case text = "Plain Text"
        case markdown = "Markdown"
        case pdf = "PDF"
        case json = "JSON"
        case csv = "CSV"
        
        var fileExtension: String {
            switch self {
            case .text: return "txt"
            case .markdown: return "md"
            case .pdf: return "pdf"
            case .json: return "json"
            case .csv: return "csv"
            }
        }
        
        var utType: UTType {
            switch self {
            case .text: return .plainText
            case .markdown: return UTType("net.daringfireball.markdown") ?? .plainText
            case .pdf: return .pdf
            case .json: return .json
            case .csv: return .commaSeparatedText
            }
        }
    }
    
    func exportTranscript(_ transcript: Transcript, format: ExportFormat) -> URL? {
        guard let meeting = transcript.meeting else {
            errorMessage = "No meeting associated with transcript"
            return nil
        }
        
        isExporting = true
        defer { isExporting = false }
        
        let fileName = "\(meeting.title)_transcript_\(formatDate(meeting.startDate)).\(format.fileExtension)"
        
        let content = generateContent(for: transcript, format: format)
        
        do {
            let url = try saveToFile(content: content, fileName: fileName, format: format)
            return url
        } catch {
            errorMessage = "Export failed: \(error.localizedDescription)"
            return nil
        }
    }
    
    func exportMeeting(_ meeting: Meeting, format: ExportFormat) -> URL? {
        isExporting = true
        defer { isExporting = false }
        
        let fileName = "\(meeting.title)_meeting_\(formatDate(meeting.startDate)).\(format.fileExtension)"
        
        let content = generateMeetingContent(for: meeting, format: format)
        
        do {
            let url = try saveToFile(content: content, fileName: fileName, format: format)
            return url
        } catch {
            errorMessage = "Export failed: \(error.localizedDescription)"
            return nil
        }
    }
    
    func exportMultipleMeetings(_ meetings: [Meeting], format: ExportFormat) -> URL? {
        isExporting = true
        defer { isExporting = false }
        
        let fileName = "meetings_export_\(formatDate(Date())).\(format.fileExtension)"
        
        let content = generateMultipleMeetingsContent(meetings: meetings, format: format)
        
        do {
            let url = try saveToFile(content: content, fileName: fileName, format: format)
            return url
        } catch {
            errorMessage = "Export failed: \(error.localizedDescription)"
            return nil
        }
    }
    
    private func generateContent(for transcript: Transcript, format: ExportFormat) -> String {
        let meeting = transcript.meeting!
        
        switch format {
        case .text:
            return generatePlainText(transcript: transcript, meeting: meeting)
        case .markdown:
            return generateMarkdown(transcript: transcript, meeting: meeting)
        case .json:
            return generateJSON(transcript: transcript, meeting: meeting)
        case .csv:
            return generateCSV(transcript: transcript, meeting: meeting)
        case .pdf:
            return generatePlainText(transcript: transcript, meeting: meeting) // PDF will be handled separately
        }
    }
    
    private func generatePlainText(transcript: Transcript, meeting: Meeting) -> String {
        var content = """
        MEETING TRANSCRIPT
        ==================
        
        Meeting: \(meeting.title)
        Date: \(formatFullDate(meeting.startDate))
        Duration: \(formatDuration(meeting.duration))
        Location: \(meeting.location ?? "Not specified")
        Participants: \(meeting.participants.isEmpty ? "Not specified" : meeting.participants.joined(separator: ", "))
        
        TRANSCRIPT
        ----------
        \(transcript.content)
        
        """
        
        if let summary = transcript.summary, !summary.isEmpty {
            content += """
            
            SUMMARY
            -------
            \(summary)
            
            """
        }
        
        if !transcript.keyPoints.isEmpty {
            content += """
            
            KEY POINTS
            ----------
            \(transcript.keyPoints.enumerated().map { "• \($0.element)" }.joined(separator: "\n"))
            
            """
        }
        
        if !transcript.actionItems.isEmpty {
            content += """
            
            ACTION ITEMS
            ------------
            \(transcript.actionItems.enumerated().map { "\($0.offset + 1). \($0.element)" }.joined(separator: "\n"))
            
            """
        }
        
        content += """
        
        Generated by CallAI on \(formatFullDate(Date()))
        Confidence: \(Int(transcript.confidence * 100))%
        """
        
        return content
    }
    
    private func generateMarkdown(transcript: Transcript, meeting: Meeting) -> String {
        var content = """
        # Meeting Transcript: \(meeting.title)
        
        **Date:** \(formatFullDate(meeting.startDate))  
        **Duration:** \(formatDuration(meeting.duration))  
        **Location:** \(meeting.location ?? "Not specified")  
        **Participants:** \(meeting.participants.isEmpty ? "Not specified" : meeting.participants.joined(separator: ", "))
        
        ## Transcript
        
        \(transcript.content)
        
        """
        
        if let summary = transcript.summary, !summary.isEmpty {
            content += """
            
            ## Summary
            
            \(summary)
            
            """
        }
        
        if !transcript.keyPoints.isEmpty {
            content += """
            
            ## Key Points
            
            \(transcript.keyPoints.map { "- \($0)" }.joined(separator: "\n"))
            
            """
        }
        
        if !transcript.actionItems.isEmpty {
            content += """
            
            ## Action Items
            
            \(transcript.actionItems.enumerated().map { "\($0.offset + 1). \($0.element)" }.joined(separator: "\n"))
            
            """
        }
        
        content += """
        
        ---
        *Generated by CallAI on \(formatFullDate(Date()))*  
        *Transcript Confidence: \(Int(transcript.confidence * 100))%*
        """
        
        return content
    }
    
    private func generateJSON(transcript: Transcript, meeting: Meeting) -> String {
        let exportData: [String: Any] = [
            "meeting": [
                "id": meeting.id.uuidString,
                "title": meeting.title,
                "startDate": ISO8601DateFormatter().string(from: meeting.startDate),
                "endDate": ISO8601DateFormatter().string(from: meeting.endDate),
                "duration": meeting.duration,
                "location": meeting.location as Any,
                "participants": meeting.participants,
                "isFromCalendar": meeting.isFromCalendar,
                "autoRecorded": meeting.autoRecorded
            ],
            "transcript": [
                "id": transcript.id.uuidString,
                "content": transcript.content,
                "summary": transcript.summary as Any,
                "keyPoints": transcript.keyPoints,
                "actionItems": transcript.actionItems,
                "participants": transcript.participants,
                "confidence": transcript.confidence,
                "language": transcript.language as Any,
                "duration": transcript.duration as Any,
                "wordCount": transcript.wordCount,
                "createdAt": ISO8601DateFormatter().string(from: transcript.createdAt)
            ],
            "exportInfo": [
                "exportedAt": ISO8601DateFormatter().string(from: Date()),
                "exportedBy": "CallAI",
                "version": "1.0"
            ]
        ]
        
        do {
            let data = try JSONSerialization.data(withJSONObject: exportData, options: .prettyPrinted)
            return String(data: data, encoding: .utf8) ?? "{}"
        } catch {
            return "{\"error\": \"Failed to serialize JSON\"}"
        }
    }
    
    private func generateCSV(transcript: Transcript, meeting: Meeting) -> String {
        var csv = "Meeting Title,Date,Duration,Location,Participants,Summary,Key Points,Action Items,Confidence\n"
        
        let title = escapeCSV(meeting.title)
        let date = formatFullDate(meeting.startDate)
        let duration = formatDuration(meeting.duration)
        let location = escapeCSV(meeting.location ?? "")
        let participants = escapeCSV(meeting.participants.joined(separator: "; "))
        let summary = escapeCSV(transcript.summary ?? "")
        let keyPoints = escapeCSV(transcript.keyPoints.joined(separator: "; "))
        let actionItems = escapeCSV(transcript.actionItems.joined(separator: "; "))
        let confidence = "\(Int(transcript.confidence * 100))%"
        
        csv += "\(title),\(date),\(duration),\(location),\(participants),\(summary),\(keyPoints),\(actionItems),\(confidence)\n"
        
        return csv
    }
    
    private func generateMeetingContent(for meeting: Meeting, format: ExportFormat) -> String {
        if let transcript = meeting.transcript {
            return generateContent(for: transcript, format: format)
        }
        
        // Generate meeting info without transcript
        switch format {
        case .text, .pdf:
            return """
            MEETING INFORMATION
            ===================
            
            Meeting: \(meeting.title)
            Date: \(formatFullDate(meeting.startDate))
            Duration: \(formatDuration(meeting.duration))
            Location: \(meeting.location ?? "Not specified")
            Participants: \(meeting.participants.isEmpty ? "Not specified" : meeting.participants.joined(separator: ", "))
            Status: \(meeting.isRecorded ? "Recorded" : "Not recorded")
            
            Generated by CallAI on \(formatFullDate(Date()))
            """
        case .markdown:
            return """
            # Meeting: \(meeting.title)
            
            **Date:** \(formatFullDate(meeting.startDate))  
            **Duration:** \(formatDuration(meeting.duration))  
            **Location:** \(meeting.location ?? "Not specified")  
            **Participants:** \(meeting.participants.isEmpty ? "Not specified" : meeting.participants.joined(separator: ", "))  
            **Status:** \(meeting.isRecorded ? "Recorded" : "Not recorded")
            
            ---
            *Generated by CallAI on \(formatFullDate(Date()))*
            """
        case .json:
            let data: [String: Any] = [
                "meeting": [
                    "id": meeting.id.uuidString,
                    "title": meeting.title,
                    "startDate": ISO8601DateFormatter().string(from: meeting.startDate),
                    "endDate": ISO8601DateFormatter().string(from: meeting.endDate),
                    "duration": meeting.duration,
                    "location": meeting.location as Any,
                    "participants": meeting.participants,
                    "isRecorded": meeting.isRecorded,
                    "isFromCalendar": meeting.isFromCalendar
                ]
            ]
            
            do {
                let jsonData = try JSONSerialization.data(withJSONObject: data, options: .prettyPrinted)
                return String(data: jsonData, encoding: .utf8) ?? "{}"
            } catch {
                return "{\"error\": \"Failed to serialize JSON\"}"
            }
        case .csv:
            return "Meeting Title,Date,Duration,Location,Participants,Status\n\"\(meeting.title)\",\"\(formatFullDate(meeting.startDate))\",\"\(formatDuration(meeting.duration))\",\"\(meeting.location ?? "")\",\"\(meeting.participants.joined(separator: "; "))\",\"\(meeting.isRecorded ? "Recorded" : "Not recorded")\""
        }
    }
    
    private func generateMultipleMeetingsContent(meetings: [Meeting], format: ExportFormat) -> String {
        switch format {
        case .csv:
            var csv = "Meeting Title,Date,Duration,Location,Participants,Status,Has Transcript\n"
            for meeting in meetings {
                let title = escapeCSV(meeting.title)
                let date = formatFullDate(meeting.startDate)
                let duration = formatDuration(meeting.duration)
                let location = escapeCSV(meeting.location ?? "")
                let participants = escapeCSV(meeting.participants.joined(separator: "; "))
                let status = meeting.isRecorded ? "Recorded" : "Not recorded"
                let hasTranscript = meeting.transcript != nil ? "Yes" : "No"
                
                csv += "\(title),\(date),\(duration),\(location),\(participants),\(status),\(hasTranscript)\n"
            }
            return csv
        default:
            return meetings.map { generateMeetingContent(for: $0, format: format) }.joined(separator: "\n\n---\n\n")
        }
    }
    
    private func saveToFile(content: String, fileName: String, format: ExportFormat) throws -> URL {
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let fileURL = documentsPath.appendingPathComponent(fileName)
        
        try content.write(to: fileURL, atomically: true, encoding: .utf8)
        return fileURL
    }
    
    // Utility methods
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }
    
    private func formatFullDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .full
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
    
    private func formatDuration(_ duration: TimeInterval) -> String {
        let hours = Int(duration) / 3600
        let minutes = Int(duration) % 3600 / 60
        
        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }
    
    private func escapeCSV(_ string: String) -> String {
        let escaped = string.replacingOccurrences(of: "\"", with: "\"\"")
        return "\"\(escaped)\""
    }
}