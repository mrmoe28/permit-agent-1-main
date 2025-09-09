import SwiftUI
import SwiftData

struct MeetingsListView: View {
    @StateObject private var calendarService = CalendarServiceImpl()
    @StateObject private var meetingSelectionManager = MeetingSelectionManager.shared
    @Query private var storedMeetings: [Meeting]
    @State private var showingPermissionAlert = false
    @State private var showingCustomMeeting = false
    @State private var customMeetingTitle = ""
    @State private var customMeetingDate = Date()
    @State private var customMeetingDuration = 60.0
    @Environment(\.modelContext) private var modelContext
    
    // Binding to parent tab selection to enable auto-navigation
    @Binding var selectedTab: Int
    
    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(spacing: 20) {
                    if calendarService.authorizationStatus != .fullAccess {
                        PermissionBannerView(
                            icon: "calendar",
                            title: "Calendar Access Required",
                            message: calendarService.errorMessage ?? "Grant calendar access to view your upcoming meetings",
                            buttonTitle: "Grant Access"
                        ) {
                            Task {
                                try await calendarService.requestPermission()
                                if calendarService.authorizationStatus == .denied {
                                    showingPermissionAlert = true
                                }
                            }
                        }
                        .padding(.horizontal)
                    }
                    
                    if !calendarService.meetings.isEmpty {
                        VStack(alignment: .leading, spacing: 16) {
                            HStack {
                                Text("Upcoming Meetings")
                                    .font(.title2)
                                    .fontWeight(.bold)
                                    .foregroundStyle(.primary)
                                Spacer()
                            }
                            .padding(.horizontal)
                            
                            LazyVGrid(columns: [
                                GridItem(.flexible(), spacing: 16),
                                GridItem(.flexible(), spacing: 16)
                            ], spacing: 16) {
                                ForEach(calendarService.meetings, id: \.id) { meeting in
                                    NavigationLink(destination: MeetingDetailView(meeting: meeting)) {
                                        MeetingCardView(meeting: meeting)
                                    }
                                    .buttonStyle(PlainButtonStyle())
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                    
                    if !storedMeetings.isEmpty {
                        VStack(alignment: .leading, spacing: 16) {
                            HStack {
                                Text("Recorded Meetings")
                                    .font(.title2)
                                    .fontWeight(.bold)
                                    .foregroundStyle(.primary)
                                Spacer()
                            }
                            .padding(.horizontal)
                            
                            LazyVGrid(columns: [
                                GridItem(.flexible(), spacing: 16),
                                GridItem(.flexible(), spacing: 16)
                            ], spacing: 16) {
                                ForEach(storedMeetings.filter { $0.isRecorded }, id: \.id) { meeting in
                                    NavigationLink(destination: MeetingDetailView(meeting: meeting)) {
                                        MeetingCardView(meeting: meeting)
                                    }
                                    .buttonStyle(PlainButtonStyle())
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                    
                    if calendarService.meetings.isEmpty && storedMeetings.isEmpty && calendarService.authorizationStatus == .fullAccess {
                        ContentUnavailableView(
                            "No Meetings Found",
                            systemImage: "calendar.badge.exclamationmark",
                            description: Text("Your upcoming meetings will appear here")
                        )
                        .frame(maxHeight: .infinity)
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle("Meetings")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showingCustomMeeting = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .refreshable {
                try await calendarService.loadUpcomingMeetings()
            }
            .onAppear {
                if calendarService.authorizationStatus == .fullAccess {
                    Task {
                        try await calendarService.loadUpcomingMeetings()
                    }
                }
            }
            .alert("Calendar Permission Required", isPresented: $showingPermissionAlert) {
                Button("Open System Settings") {
                    #if os(macOS)
                    if let url = URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_Calendars") {
                        NSWorkspace.shared.open(url)
                    }
                    #else
                    if let url = URL(string: "App-prefs:root=Privacy&path=CALENDARS") {
                        UIApplication.shared.open(url)
                    }
                    #endif
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("Please enable calendar access for CallAI in System Settings > Privacy & Security > Calendar")
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
                    
                    // Set up for recording and navigate
                    meetingSelectionManager.selectMeetingForRecording(meeting)
                    
                    // Clear form fields and dismiss sheet
                    customMeetingTitle = ""
                    customMeetingDate = Date()
                    customMeetingDuration = 60.0
                    showingCustomMeeting = false
                    
                    // Navigate to Record tab after a brief delay
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                        selectedTab = 1
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .presentationDetents([.height(500)])
                .presentationDragIndicator(.hidden)
            }
        }
    }
}

struct MeetingCardView: View {
    let meeting: Meeting
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
                // Header with icon and status
                HStack {
                    VStack {
                        ZStack {
                            Circle()
                                .fill(statusColor.gradient)
                                .frame(width: 50, height: 50)
                            
                            Image(systemName: statusIcon)
                                .font(.system(size: 24, weight: .medium))
                                .foregroundStyle(.white)
                                .symbolEffect(.pulse, isActive: meeting.isInProgress)
                        }
                    }
                    
                    Spacer()
                    
                    VStack(alignment: .trailing, spacing: 4) {
                        Text(formatDuration(meeting.duration))
                            .font(.caption)
                            .fontWeight(.medium)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(.ultraThinMaterial, in: Capsule())
                        
                        Text(meeting.startDate.formatted(date: .omitted, time: .shortened))
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
                
                // Meeting title and details
                VStack(alignment: .leading, spacing: 8) {
                    Text(meeting.title)
                        .font(.headline)
                        .fontWeight(.semibold)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                        .foregroundStyle(.primary)
                    
                    VStack(alignment: .leading, spacing: 4) {
                        HStack(spacing: 4) {
                            Image(systemName: "calendar")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Text(meeting.startDate.formatted(date: .abbreviated, time: .omitted))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        
                        if let location = meeting.location, !location.isEmpty {
                            HStack(spacing: 4) {
                                Image(systemName: "location")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                Text(location)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                    .lineLimit(1)
                            }
                        }
                    }
                }
                
                Spacer()
        }
        .padding(20)
        .frame(maxWidth: .infinity, minHeight: 140)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
        .overlay {
            RoundedRectangle(cornerRadius: 16)
                .stroke(.quaternary.opacity(0.5), lineWidth: 1)
        }
        .shadow(color: .black.opacity(0.08), radius: 8, x: 0, y: 4)
    }
    
    private var statusIcon: String {
        if meeting.isRecorded {
            return "checkmark.circle.fill"
        } else if meeting.isInProgress {
            return "record.circle"
        } else if meeting.isUpcoming {
            return "clock.fill"
        } else {
            return "calendar"
        }
    }
    
    private var statusColor: Color {
        if meeting.isRecorded {
            return .green
        } else if meeting.isInProgress {
            return .red
        } else if meeting.isUpcoming {
            return .orange
        } else {
            return .blue
        }
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

struct MeetingsListRowView: View {
    let meeting: Meeting
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(meeting.title)
                    .font(.headline)
                    .lineLimit(2)
                
                Text(meeting.startDate, style: .date)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Text("\(meeting.startDate.formatted(date: .omitted, time: .shortened)) - \(meeting.endDate.formatted(date: .omitted, time: .shortened))")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                if let location = meeting.location, !location.isEmpty {
                    Label(location, systemImage: "location")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            VStack {
                if meeting.isRecorded {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                } else if meeting.isInProgress {
                    Image(systemName: "record.circle")
                        .foregroundColor(.red)
                        .symbolEffect(.pulse)
                } else if meeting.isUpcoming {
                    Image(systemName: "clock")
                        .foregroundColor(.orange)
                }
                
                Text(formatDuration(meeting.duration))
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
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

struct PermissionBannerView: View {
    let icon: String
    let title: String
    let message: String
    let buttonTitle: String
    let action: () -> Void
    
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: icon)
                .font(.largeTitle)
                .foregroundColor(.blue)
            
            VStack(spacing: 4) {
                Text(title)
                    .font(.headline)
                Text(message)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            Button(buttonTitle) {
                action()
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(12)
        .listRowInsets(EdgeInsets())
        .listRowBackground(Color.clear)
    }
}

#Preview {
    MeetingsListView(selectedTab: .constant(0))
        .modelContainer(for: [Meeting.self, Transcript.self])
}
