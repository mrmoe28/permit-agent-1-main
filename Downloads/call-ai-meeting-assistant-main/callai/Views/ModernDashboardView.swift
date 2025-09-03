import SwiftUI

// MARK: - Meeting Store (Observable)

@MainActor
class MeetingStore: ObservableObject {
    @Published var currentMeeting: Meeting?
    @Published var currentStatus: MeetingStatus = .idle
    @Published var progress: Double = 0.0
    @Published var isRecording: Bool = false
    @Published var recentMeetings: [DashboardMeeting] = []
    @Published var keyTakeaways: [String] = []
    
    init() {
        loadSampleData()
    }
    
    private func loadSampleData() {
        keyTakeaways = [
            "Q4 revenue targets exceeded by 23%, driven by enterprise client growth",
            "New product launch scheduled for March with beta testing in February",
            "Team restructuring will focus on cross-functional collaboration"
        ]
        
        recentMeetings = [
            DashboardMeeting(
                id: UUID(),
                title: "Product Strategy Review",
                subtitle: "Yesterday • 45 min • with Sarah, John, Mike",
                duration: "45:30",
                status: .completed,
                progress: 1.0
            ),
            DashboardMeeting(
                id: UUID(),
                title: "Weekly Team Standup",
                subtitle: "2 days ago • 15 min • with Development Team",
                duration: "15:20",
                status: .processing,
                progress: 0.78
            ),
            DashboardMeeting(
                id: UUID(),
                title: "Client Onboarding Call",
                subtitle: "Dec 15 • 30 min • with Alex Chen, Lisa Park",
                duration: "32:15",
                status: .completed,
                progress: 1.0
            ),
            DashboardMeeting(
                id: UUID(),
                title: "Budget Planning Session",
                subtitle: "Dec 12 • 1h 20m • with Finance Team",
                duration: "1:20:45",
                status: .completed,
                progress: 1.0
            )
        ]
    }
    
    func startRecording() {
        isRecording = true
        currentStatus = .recording
        progress = 0.0
        
        // Simulate recording progress
        Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { timer in
            Task { @MainActor in
                self.progress += 0.01
                if self.progress >= 1.0 {
                    timer.invalidate()
                    self.stopRecording()
                }
            }
        }
    }
    
    func stopRecording() {
        isRecording = false
        currentStatus = .processing
        progress = 0.0
        
        AppHaptic.notification(.success)
        
        // Simulate processing
        Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { timer in
            Task { @MainActor in
                self.progress += 0.05
                if self.progress >= 1.0 {
                    timer.invalidate()
                    self.currentStatus = .completed
                }
            }
        }
    }
}

// MARK: - Dashboard Meeting Model

struct DashboardMeeting: Identifiable {
    let id: UUID
    let title: String
    let subtitle: String
    let duration: String
    let status: MeetingStatus
    let progress: Double?
    
    init(id: UUID, title: String, subtitle: String, duration: String, status: MeetingStatus, progress: Double? = nil) {
        self.id = id
        self.title = title
        self.subtitle = subtitle
        self.duration = duration
        self.status = status
        self.progress = progress
    }
}

// MARK: - Modern Dashboard View

struct ModernDashboardView: View {
    @StateObject private var meetingStore = MeetingStore()
    @StateObject private var accessibilityManager = AccessibilityManager()
    @State private var selectedSegment: DashboardSegment = .live
    @State private var showingNotifications = false
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    
    var body: some View {
        NavigationStack {
            ZStack {
                AppColor.surfaceBackground.ignoresSafeArea()
                
                ScrollView {
                    LazyVStack(spacing: adaptiveSectionSpacing) {
                        headerView
                        primaryStatusCard
                        
                        if !meetingStore.keyTakeaways.isEmpty {
                            highlightsSection
                        }
                        
                        meetingsSection
                    }
                    .padding(.horizontal, adaptiveHorizontalPadding)
                    .padding(.bottom, adaptiveBottomPadding)
                }
                .accessibilityElement(children: .contain)
                .accessibilityLabel("Meeting Dashboard")
            }
        }
        .preferredColorScheme(.dark)
        .environmentObject(accessibilityManager)
    }
    
    private var adaptiveSectionSpacing: CGFloat {
        switch dynamicTypeSize {
        case .accessibility1, .accessibility2, .accessibility3, .accessibility4, .accessibility5:
            return AppSpacing.sectionSpacing * 1.5
        case .xxLarge, .xxxLarge:
            return AppSpacing.sectionSpacing * 1.2
        default:
            return AppSpacing.sectionSpacing
        }
    }
    
    private var adaptiveHorizontalPadding: CGFloat {
        switch dynamicTypeSize {
        case .accessibility1, .accessibility2, .accessibility3, .accessibility4, .accessibility5:
            return AppSpacing.lg
        case .xxLarge, .xxxLarge:
            return AppSpacing.md * 1.2
        default:
            return AppSpacing.md
        }
    }
    
    private var adaptiveBottomPadding: CGFloat {
        switch dynamicTypeSize {
        case .accessibility1, .accessibility2, .accessibility3, .accessibility4, .accessibility5:
            return 120 // More space for larger text
        case .xxLarge, .xxxLarge:
            return 110
        default:
            return 100
        }
    }
    
    // MARK: - Header
    
    private var headerView: some View {
        HStack(spacing: adaptiveHeaderSpacing) {
            // Left: Avatar and greeting
            HStack(spacing: AppSpacing.sm) {
                Circle()
                    .fill(AppColor.brandGradient)
                    .frame(width: avatarSize, height: avatarSize)
                    .overlay(
                        Text("JD")
                            .font(AppFont.buttonSmall)
                            .semanticForeground(.white)
                    )
                    .accessibilityLabel("User avatar")
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("Hello, **John**")
                        .font(AppFont.h2)
                        .semanticForeground(AppColor.textPrimary)
                        .lineLimit(greetingLineLimit)
                        .minimumScaleFactor(0.8)
                    
                    Text("Today, \(formattedDate)")
                        .font(AppFont.caption)
                        .semanticForeground(AppColor.textMuted)
                        .lineLimit(dateLineLimit)
                }
            }
            .accessibilityElement(children: .combine)
            .accessibilityLabel("Hello John, Today is \(formattedDate)")
            
            Spacer()
            
            // Right: Notifications
            Button(action: {
                AppHaptic.selection()
                showingNotifications = true
            }) {
                Image(systemName: "bell.badge")
                    .font(.system(size: notificationIconSize, weight: .medium))
                    .semanticForeground(AppColor.textSecondary)
                    .frame(width: 44, height: 44)
            }
            .accessibleTapTarget()
            .enhancedAccessibility(
                label: "Notifications",
                hint: "Double tap to view notifications",
                traits: .isButton
            )
            .voiceOverFriendly(sortPriority: 2)
        }
        .padding(.top, adaptiveTopPadding)
    }
    
    private var adaptiveHeaderSpacing: CGFloat {
        switch dynamicTypeSize {
        case .accessibility1, .accessibility2, .accessibility3, .accessibility4, .accessibility5:
            return AppSpacing.md
        default:
            return AppSpacing.sm
        }
    }
    
    private var avatarSize: CGFloat {
        switch dynamicTypeSize {
        case .accessibility1, .accessibility2, .accessibility3, .accessibility4, .accessibility5:
            return 44
        case .xxLarge, .xxxLarge:
            return 40
        default:
            return 36
        }
    }
    
    private var greetingLineLimit: Int {
        switch dynamicTypeSize {
        case .accessibility1, .accessibility2, .accessibility3, .accessibility4, .accessibility5:
            return 2
        default:
            return 1
        }
    }
    
    private var dateLineLimit: Int {
        switch dynamicTypeSize {
        case .accessibility1, .accessibility2, .accessibility3, .accessibility4, .accessibility5:
            return 2
        default:
            return 1
        }
    }
    
    private var notificationIconSize: CGFloat {
        switch dynamicTypeSize {
        case .accessibility1, .accessibility2, .accessibility3, .accessibility4, .accessibility5:
            return 24
        case .xxLarge, .xxxLarge:
            return 22
        default:
            return 20
        }
    }
    
    private var adaptiveTopPadding: CGFloat {
        switch dynamicTypeSize {
        case .accessibility1, .accessibility2, .accessibility3, .accessibility4, .accessibility5:
            return AppSpacing.md
        default:
            return AppSpacing.sm
        }
    }
    
    // MARK: - Primary Status Card
    
    private var primaryStatusCard: some View {
        VStack(spacing: AppSpacing.lg) {
            // Status and controls row
            HStack {
                StatusChip(meetingStore.currentStatus, animated: meetingStore.isRecording)
                
                Spacer()
                
                segmentedControl
            }
            
            // Main content
            if selectedSegment == .live {
                liveContent
            } else {
                summaryContent
            }
        }
        .padding(AppSpacing.lg)
        .cardStyle(isPrimary: true)
    }
    
    private var segmentedControl: some View {
        HStack(spacing: 0) {
            segmentButton("Live", .live)
            segmentButton("Summary", .summary)
        }
        .background(
            RoundedRectangle(cornerRadius: AppRadius.sm)
                .fill(AppColor.controlsTrack)
        )
    }
    
    private func segmentButton(_ title: String, _ segment: DashboardSegment) -> some View {
        Button(action: {
            AppHaptic.selection()
            selectedSegment = segment
        }) {
            Text(title)
                .font(AppFont.buttonSmall)
                .semanticForeground(selectedSegment == segment ? .white : AppColor.textSecondary)
                .frame(height: 32)
                .frame(minWidth: 60)
                .background(
                    RoundedRectangle(cornerRadius: AppRadius.sm)
                        .fill(selectedSegment == segment ? .white.opacity(0.2) : .clear)
                )
        }
        .accessibleTapTarget(minSize: 32)
    }
    
    private var liveContent: some View {
        VStack(spacing: AppSpacing.md) {
            HStack {
                ProgressRing(progress: meetingStore.progress, size: 100, lineWidth: 6)
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: AppSpacing.xs) {
                    Text(statusMessage)
                        .font(AppFont.body)
                        .semanticForeground(.white)
                        .multilineTextAlignment(.trailing)
                    
                    Text(microHint)
                        .font(AppFont.caption)
                        .semanticForeground(.white.opacity(0.7))
                        .multilineTextAlignment(.trailing)
                }
            }
            
            if meetingStore.currentStatus == .idle {
                ctaRow
            }
        }
    }
    
    private var summaryContent: some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            Text("Latest Summary")
                .font(AppFont.h3)
                .semanticForeground(.white)
            
            Text("Last meeting covered Q4 performance review with key decisions on budget allocation and team expansion plans for 2024.")
                .font(AppFont.body)
                .semanticForeground(.white.opacity(0.8))
                .multilineTextAlignment(.leading)
            
            HStack {
                Text("45 min • 3 action items")
                    .font(AppFont.caption)
                    .semanticForeground(.white.opacity(0.6))
                
                Spacer()
                
                SecondaryButton("View Full", icon: "arrow.up.right") {
                    // Navigate to full summary
                }
            }
        }
    }
    
    private var ctaRow: some View {
        HStack(spacing: AppSpacing.sm) {
            PrimaryButton(
                meetingStore.isRecording ? "Stop Recording" : "Record",
                icon: meetingStore.isRecording ? "stop.fill" : "mic.fill",
                isLoading: meetingStore.currentStatus == .processing
            ) {
                if meetingStore.isRecording {
                    meetingStore.stopRecording()
                } else {
                    meetingStore.startRecording()
                }
            }
            
            if !meetingStore.isRecording {
                SecondaryButton("Import", icon: "square.and.arrow.down") {
                    // Import functionality
                }
                
                SecondaryButton("Schedule", icon: "calendar.badge.plus") {
                    // Schedule functionality
                }
            }
        }
    }
    
    // MARK: - Highlights Section
    
    private var highlightsSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            HighlightsWidget(keyTakeaways: meetingStore.keyTakeaways) {
                // Navigate to full summary
            }
        }
    }
    
    // MARK: - Meetings Section
    
    private var meetingsSection: some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            HStack {
                Text("Recent Meetings")
                    .font(AppFont.h2)
                    .semanticForeground(AppColor.textPrimary)
                
                Spacer()
                
                Button("See All") {
                    AppHaptic.selection()
                    // Navigate to meetings list
                }
                .font(AppFont.caption)
                .semanticForeground(AppColor.brandPurple)
            }
            
            LazyVStack(spacing: AppSpacing.md) {
                ForEach(meetingStore.recentMeetings) { meeting in
                    MeetingCard(
                        title: meeting.title,
                        subtitle: meeting.subtitle,
                        duration: meeting.duration,
                        status: meeting.status,
                        progress: meeting.progress,
                        onTap: {
                            // Navigate to meeting detail
                        },
                        onPlay: {
                            // Play recording
                        },
                        onTranscript: {
                            // Show transcript
                        },
                        onSummary: {
                            // Show summary
                        }
                    )
                }
            }
        }
    }
    
    // MARK: - Computed Properties
    
    private var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, MMM d"
        return formatter.string(from: Date())
    }
    
    private var statusMessage: String {
        switch meetingStore.currentStatus {
        case .idle:
            return "Ready to record your next meeting"
        case .recording:
            return "You're doing well—\(Int(meetingStore.progress * 100))% captured"
        case .processing:
            return "Processing your recording"
        case .completed:
            return "Transcription complete!"
        }
    }
    
    private var microHint: String {
        switch meetingStore.currentStatus {
        case .idle:
            return "Tap Record to begin"
        case .recording:
            return "Live transcript available"
        case .processing:
            return "Analyzing content..."
        case .completed:
            return "Ready for review"
        }
    }
}

// MARK: - Supporting Types

enum DashboardSegment: CaseIterable {
    case live
    case summary
}

// MARK: - Custom Tab Bar

struct CustomTabBar: View {
    @Binding var selectedTab: Int
    @StateObject private var meetingStore = MeetingStore()
    
    var body: some View {
        HStack {
            ForEach(0..<tabs.count, id: \.self) { index in
                if index == 1 { // Record button
                    RecordButton(isRecording: meetingStore.isRecording) {
                        if meetingStore.isRecording {
                            meetingStore.stopRecording()
                        } else {
                            meetingStore.startRecording()
                        }
                    }
                } else {
                    TabButton(
                        icon: tabs[index].icon,
                        title: tabs[index].title,
                        isSelected: selectedTab == index
                    ) {
                        selectedTab = index
                    }
                }
                
                if index < tabs.count - 1 && index != 0 {
                    Spacer()
                }
            }
        }
        .padding(.horizontal, AppSpacing.lg)
        .padding(.vertical, AppSpacing.sm)
        .background(
            AppColor.surfaceElevated
                .overlay(
                    Rectangle()
                        .fill(AppColor.borderHairline)
                        .frame(height: 1),
                    alignment: .top
                )
        )
    }
    
    private var tabs: [(icon: String, title: String)] {
        [
            ("house.fill", "Home"),
            ("mic.fill", "Record"),
            ("doc.plaintext.fill", "Transcripts"),
            ("chart.bar.fill", "Insights")
        ]
    }
}

struct TabButton: View {
    let icon: String
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: {
            AppHaptic.selection()
            action()
        }) {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 20, weight: .medium))
                    .semanticForeground(isSelected ? AppColor.brandPurple : AppColor.textMuted)
                
                Text(title)
                    .font(.system(size: 10, weight: .medium))
                    .semanticForeground(isSelected ? AppColor.brandPurple : AppColor.textMuted)
            }
        }
        .frame(maxWidth: .infinity)
        .accessibleTapTarget()
        .accessibilityLabel(title)
    }
}

// MARK: - Main App with Custom Tab Bar

struct ModernDashboardApp: View {
    @State private var selectedTab = 0
    
    var body: some View {
        VStack(spacing: 0) {
            // Content
            Group {
                switch selectedTab {
                case 0:
                    ModernDashboardView()
                case 2:
                    TranscriptsView()
                case 3:
                    Text("Insights")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(AppColor.surfaceBackground)
                        .semanticForeground(AppColor.textPrimary)
                default:
                    ModernDashboardView()
                }
            }
            
            // Custom Tab Bar
            CustomTabBar(selectedTab: $selectedTab)
        }
        .ignoresSafeArea(.keyboard)
        .preferredColorScheme(.dark)
    }
}

#Preview {
    ModernDashboardApp()
}