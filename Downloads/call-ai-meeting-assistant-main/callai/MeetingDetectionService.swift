import Foundation
import EventKit
import SwiftUI
import UserNotifications

@MainActor
class MeetingDetectionService: ObservableObject {
    @Published var currentMeeting: Meeting?
    @Published var upcomingMeeting: Meeting?
    @Published var isAutoRecording = false
    @Published var autoRecordEnabled = false
    
    private let calendarService: any CalendarService
    private let audioService: any AudioRecordingService
    private var timer: Timer?
    private var currentRecordingURL: URL?
    
    init(calendarService: any CalendarService, audioService: any AudioRecordingService) {
        self.calendarService = calendarService
        self.audioService = audioService
        setupNotifications()
        startMonitoring()
    }
    
    deinit {
        // Timer cleanup is handled when monitoring stops
    }
    
    private func setupNotifications() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if let error = error {
                print("Notification authorization error: \(error)")
            }
        }
    }
    
    func toggleAutoRecord(_ enabled: Bool) {
        autoRecordEnabled = enabled
        if enabled {
            startMonitoring()
        } else {
            stopMonitoring()
            if isAutoRecording {
                Task {
                    await stopAutoRecording()
                }
            }
        }
    }
    
    private func startMonitoring() {
        timer = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { [weak self] _ in
            Task {
                await self?.checkForMeetings()
            }
        }
    }
    
    private func stopMonitoring() {
        timer?.invalidate()
        timer = nil
    }
    
    private func checkForMeetings() async {
        guard autoRecordEnabled else { return }
        
        // Refresh calendar meetings
        do {
            try await calendarService.loadUpcomingMeetings()
        } catch {
            print("Failed to load upcoming meetings: \(error)")
        }
        
        let now = Date()
        let meetings = calendarService.meetings
        
        // Check if we're currently in a meeting
        let activeMeeting = meetings.first { meeting in
            now >= meeting.startDate && now <= meeting.endDate
        }
        
        // Check for upcoming meeting (within 5 minutes)
        let upcomingMeeting = meetings.first { meeting in
            let timeUntilStart = meeting.startDate.timeIntervalSince(now)
            return timeUntilStart > 0 && timeUntilStart <= 300 // 5 minutes
        }
        
        await handleMeetingStateChange(active: activeMeeting, upcoming: upcomingMeeting)
    }
    
    private func handleMeetingStateChange(active: Meeting?, upcoming: Meeting?) async {
        // Handle active meeting state
        if let activeMeeting = active {
            if currentMeeting?.id != activeMeeting.id {
                // New meeting started
                currentMeeting = activeMeeting
                await startAutoRecording(for: activeMeeting)
                sendNotification("Recording Started", "Started recording: \(activeMeeting.title)")
            }
        } else if currentMeeting != nil {
            // Meeting ended
            await stopAutoRecording()
            sendNotification("Recording Stopped", "Meeting recording completed")
            currentMeeting = nil
        }
        
        // Handle upcoming meeting notification
        if let upcomingMeeting = upcoming, upcomingMeeting.id != self.upcomingMeeting?.id {
            self.upcomingMeeting = upcomingMeeting
            let timeUntil = Int(upcomingMeeting.startDate.timeIntervalSince(Date()) / 60)
            sendNotification("Upcoming Meeting", "\(upcomingMeeting.title) starts in \(timeUntil) minutes")
        } else if upcoming == nil {
            self.upcomingMeeting = nil
        }
    }
    
    private func startAutoRecording(for meeting: Meeting) async {
        guard !isAutoRecording else { return }
        
        isAutoRecording = true
        do {
            try await audioService.startRecording()
        } catch {
            print("Failed to start recording: \(error)")
            return
        }
    }
    
    private func stopAutoRecording() async {
        guard isAutoRecording, currentMeeting != nil else { return }
        
        do {
            currentRecordingURL = try await audioService.stopRecording()
        } catch {
            print("Failed to stop recording: \(error)")
            return
        }
        isAutoRecording = false
        
        // Automatically start transcription if we have a recording
        if currentRecordingURL != nil {
            let apiKey = AppConfig.shared.openAIAPIKey
            if !apiKey.isEmpty {
                _ = WhisperService(apiKey: apiKey)
                // Note: This would need a ModelContext to work properly
                // For now, we'll skip automatic transcription in this service
                // _ = await whisperService.transcribeAudio(from: recordingURL, for: meeting, modelContext: modelContext)
            }
        }
        
        currentRecordingURL = nil
    }
    
    private func sendNotification(_ title: String, _ body: String) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        
        let request = UNNotificationRequest(
            identifier: UUID().uuidString,
            content: content,
            trigger: UNTimeIntervalNotificationTrigger(timeInterval: 0.1, repeats: false)
        )
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Notification error: \(error)")
            }
        }
    }
    
    // Manual control methods
    func startManualRecording(for meeting: Meeting) async {
        guard !isAutoRecording && !audioService.isRecording else { return }
        
        currentMeeting = meeting
        await startAutoRecording(for: meeting)
    }
    
    func stopManualRecording() async {
        await stopAutoRecording()
        currentMeeting = nil
    }
    
    // Smart meeting detection based on patterns
    func analyzeRecordingPatterns() -> [MeetingPattern] {
        // This could analyze historical data to suggest optimal recording times
        return [
            MeetingPattern(dayOfWeek: 2, hour: 9, title: "Weekly Team Standup"),
            MeetingPattern(dayOfWeek: 4, hour: 14, title: "Thursday Review")
        ]
    }
}

struct MeetingPattern {
    let dayOfWeek: Int // 1 = Sunday, 2 = Monday, etc.
    let hour: Int
    let title: String
    let confidence: Double = 0.8
}

