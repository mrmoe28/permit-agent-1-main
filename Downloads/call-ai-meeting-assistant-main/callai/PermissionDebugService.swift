import Foundation
import AVFoundation
import EventKit
import SwiftUI

/// A debug service to monitor and test permission requests
@MainActor
class PermissionDebugService: ObservableObject {
    static let shared = PermissionDebugService()
    
    @Published var logs: [PermissionLog] = []
    @Published var microphoneStatus: String = "Unknown"
    @Published var calendarStatus: String = "Unknown"
    @Published var infoPlistStatus: InfoPlistStatus?
    
    struct PermissionLog: Identifiable {
        let id = UUID()
        let timestamp: Date
        let type: PermissionType
        let action: String
        let result: String
        let details: String?
    }
    
    enum PermissionType: String {
        case microphone = "Microphone"
        case calendar = "Calendar"
        case system = "System"
    }
    
    struct InfoPlistStatus {
        let hasMicrophoneKey: Bool
        let hasCalendarKey: Bool
        let hasFullCalendarKey: Bool
        let microphoneDescription: String?
        let calendarDescription: String?
        let fullCalendarDescription: String?
    }
    
    private init() {
        startMonitoring()
        checkInfoPlist()
    }
    
    func startMonitoring() {
        // Check initial statuses
        updateMicrophoneStatus()
        updateCalendarStatus()
        
        // Monitor changes
        Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            Task { @MainActor in
                self.updateMicrophoneStatus()
                self.updateCalendarStatus()
            }
        }
    }
    
    func checkInfoPlist() {
        let bundle = Bundle.main
        let hasMic = bundle.object(forInfoDictionaryKey: "NSMicrophoneUsageDescription") != nil
        let hasCal = bundle.object(forInfoDictionaryKey: "NSCalendarsUsageDescription") != nil
        let hasFullCal = bundle.object(forInfoDictionaryKey: "NSCalendarsFullAccessUsageDescription") != nil
        
        // Debug: Print all Info.plist keys to see what's actually there
        print("=== Debug Info.plist Keys ===")
        print("NSMicrophoneUsageDescription: \(bundle.object(forInfoDictionaryKey: "NSMicrophoneUsageDescription") as? String ?? "MISSING")")
        print("NSCalendarsUsageDescription: \(bundle.object(forInfoDictionaryKey: "NSCalendarsUsageDescription") as? String ?? "MISSING")")  
        print("NSCalendarsFullAccessUsageDescription: \(bundle.object(forInfoDictionaryKey: "NSCalendarsFullAccessUsageDescription") as? String ?? "MISSING")")
        print("================================")
        
        infoPlistStatus = InfoPlistStatus(
            hasMicrophoneKey: hasMic,
            hasCalendarKey: hasCal,
            hasFullCalendarKey: hasFullCal,
            microphoneDescription: bundle.object(forInfoDictionaryKey: "NSMicrophoneUsageDescription") as? String,
            calendarDescription: bundle.object(forInfoDictionaryKey: "NSCalendarsUsageDescription") as? String,
            fullCalendarDescription: bundle.object(forInfoDictionaryKey: "NSCalendarsFullAccessUsageDescription") as? String
        )
        
        log(type: .system, 
            action: "Info.plist Check",
            result: "Completed",
            details: """
            Microphone Key: \(hasMic ? "✅" : "❌")
            Calendar Key: \(hasCal ? "✅" : "❌")
            Full Calendar Key: \(hasFullCal ? "✅" : "❌")
            """)
    }
    
    func updateMicrophoneStatus() {
        let status = AVCaptureDevice.authorizationStatus(for: .audio)
        let statusString: String
        
        switch status {
        case .authorized:
            statusString = "Authorized ✅"
        case .denied:
            statusString = "Denied ❌"
        case .restricted:
            statusString = "Restricted ⚠️"
        case .notDetermined:
            statusString = "Not Determined ❓"
        @unknown default:
            statusString = "Unknown"
        }
        
        if microphoneStatus != statusString {
            microphoneStatus = statusString
            log(type: .microphone, 
                action: "Status Changed",
                result: statusString,
                details: nil)
        }
    }
    
    func updateCalendarStatus() {
        let status = EKEventStore.authorizationStatus(for: .event)
        let statusString: String
        
        switch status {
        case .fullAccess:
            statusString = "Full Access ✅"
        case .writeOnly:
            statusString = "Write Only ⚠️"
        case .denied:
            statusString = "Denied ❌"
        case .restricted:
            statusString = "Restricted ⚠️"
        case .notDetermined:
            statusString = "Not Determined ❓"
        @unknown default:
            statusString = "Unknown"
        }
        
        if calendarStatus != statusString {
            calendarStatus = statusString
            log(type: .calendar,
                action: "Status Changed",
                result: statusString,
                details: nil)
        }
    }
    
    func testMicrophonePermission() async {
        log(type: .microphone,
            action: "Request Started",
            result: "Pending",
            details: "Calling AVCaptureDevice.requestAccess(for: .audio)")
        
        let granted = await AVCaptureDevice.requestAccess(for: .audio)
        
        log(type: .microphone,
            action: "Request Completed",
            result: granted ? "Granted ✅" : "Denied ❌",
            details: "User response received")
        
        updateMicrophoneStatus()
    }
    
    func testCalendarPermission() async {
        log(type: .calendar,
            action: "Request Started",
            result: "Pending",
            details: "Calling EKEventStore.requestFullAccessToEvents()")
        
        let eventStore = EKEventStore()
        
        do {
            if #available(macOS 14.0, *) {
                let granted = try await eventStore.requestFullAccessToEvents()
                log(type: .calendar,
                    action: "Request Completed",
                    result: granted ? "Granted ✅" : "Denied ❌",
                    details: "Full access request completed")
            } else {
                let granted = try await eventStore.requestAccess(to: .event)
                log(type: .calendar,
                    action: "Request Completed",
                    result: granted ? "Granted ✅" : "Denied ❌",
                    details: "Legacy access request completed")
            }
        } catch {
            log(type: .calendar,
                action: "Request Failed",
                result: "Error ❌",
                details: error.localizedDescription)
        }
        
        updateCalendarStatus()
    }
    
    func log(type: PermissionType, action: String, result: String, details: String?) {
        let entry = PermissionLog(
            timestamp: Date(),
            type: type,
            action: action,
            result: result,
            details: details
        )
        logs.insert(entry, at: 0)
        
        // Also print to console for debugging
        print("[\(type.rawValue)] \(action): \(result)")
        if let details = details {
            print("  Details: \(details)")
        }
    }
    
    func exportLogs() -> String {
        var output = "CallAI Permission Debug Report\n"
        output += "Generated: \(Date())\n\n"
        
        output += "Current Status:\n"
        output += "- Microphone: \(microphoneStatus)\n"
        output += "- Calendar: \(calendarStatus)\n\n"
        
        if let plistStatus = infoPlistStatus {
            output += "Info.plist Status:\n"
            output += "- NSMicrophoneUsageDescription: \(plistStatus.hasMicrophoneKey ? "Present" : "Missing")\n"
            output += "- NSCalendarsUsageDescription: \(plistStatus.hasCalendarKey ? "Present" : "Missing")\n"
            output += "- NSCalendarsFullAccessUsageDescription: \(plistStatus.hasFullCalendarKey ? "Present" : "Missing")\n\n"
        }
        
        output += "Event Log:\n"
        for log in logs {
            output += "[\(log.timestamp.formatted())] \(log.type.rawValue) - \(log.action): \(log.result)\n"
            if let details = log.details {
                output += "  \(details)\n"
            }
        }
        
        return output
    }
}

/// Debug view for monitoring permissions
struct PermissionDebugView: View {
    @StateObject private var debugService = PermissionDebugService.shared
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Permission Debug Monitor")
                .font(.title)
                .fontWeight(.bold)
            
            HStack(spacing: 40) {
                VStack {
                    Text("Microphone")
                        .font(.headline)
                    Text(debugService.microphoneStatus)
                        .foregroundColor(debugService.microphoneStatus.contains("✅") ? .green : .red)
                    Button("Test Request") {
                        Task {
                            await debugService.testMicrophonePermission()
                        }
                    }
                    .buttonStyle(.borderedProminent)
                }
                
                VStack {
                    Text("Calendar")
                        .font(.headline)
                    Text(debugService.calendarStatus)
                        .foregroundColor(debugService.calendarStatus.contains("✅") ? .green : .red)
                    Button("Test Request") {
                        Task {
                            await debugService.testCalendarPermission()
                        }
                    }
                    .buttonStyle(.borderedProminent)
                }
            }
            
            if let plistStatus = debugService.infoPlistStatus {
                VStack(alignment: .leading) {
                    Text("Info.plist Keys:")
                        .font(.headline)
                    Text("Microphone: \(plistStatus.hasMicrophoneKey ? "✅" : "❌")")
                    Text("Calendar: \(plistStatus.hasCalendarKey ? "✅" : "❌")")
                    Text("Full Calendar: \(plistStatus.hasFullCalendarKey ? "✅" : "❌")")
                }
                .padding()
                .background(Color.gray.opacity(0.1))
                .cornerRadius(8)
            }
            
            ScrollView {
                VStack(alignment: .leading) {
                    ForEach(debugService.logs) { log in
                        HStack {
                            Text(log.timestamp.formatted(date: .omitted, time: .standard))
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Text("[\(log.type.rawValue)]")
                                .font(.caption)
                                .fontWeight(.bold)
                            Text(log.action)
                                .font(.caption)
                            Text(log.result)
                                .font(.caption)
                                .foregroundColor(log.result.contains("✅") ? .green : 
                                               log.result.contains("❌") ? .red : .primary)
                        }
                    }
                }
            }
            .frame(maxHeight: 200)
            
            Button("Export Logs") {
                let logs = debugService.exportLogs()
                print(logs)
                #if os(macOS)
                // Copy to clipboard on macOS
                NSPasteboard.general.clearContents()
                NSPasteboard.general.setString(logs, forType: .string)
                #else
                // On iOS, just print to console for now
                print("Logs exported to console")
                #endif
            }
        }
        .padding()
        .frame(width: 600, height: 500)
    }
}