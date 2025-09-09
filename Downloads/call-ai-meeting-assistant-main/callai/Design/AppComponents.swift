import SwiftUI

// MARK: - Meeting Status

enum MeetingStatus: CaseIterable {
    case recording
    case processing
    case completed
    case idle
    
    var displayName: String {
        switch self {
        case .recording: return "Recording"
        case .processing: return "Processing"
        case .completed: return "Completed"
        case .idle: return "Ready"
        }
    }
    
    var iconName: String {
        switch self {
        case .recording: return "record.circle.fill"
        case .processing: return "gearshape.fill"
        case .completed: return "checkmark.circle.fill"
        case .idle: return "mic.fill"
        }
    }
    
    var color: Color {
        switch self {
        case .recording: return .red
        case .processing: return .orange
        case .completed: return .green
        case .idle: return .blue
        }
    }
}

// MARK: - Status Chip Component

struct StatusChip: View {
    let status: MeetingStatus
    let isAnimated: Bool
    
    init(_ status: MeetingStatus, animated: Bool = false) {
        self.status = status
        self.isAnimated = animated
    }
    
    var body: some View {
        HStack(spacing: AppSpacing.xs) {
            Circle()
                .fill(status.color)
                .frame(width: 8, height: 8)
                .scaleEffect(isAnimated ? 1.2 : 1.0)
                .animation(
                    isAnimated ? Animation.easeInOut(duration: 0.8).repeatForever(autoreverses: true) : .none,
                    value: isAnimated
                )
            
            Text(status.displayName)
                .font(AppFont.caption)
                .semanticForeground(AppColor.textSecondary)
        }
        .padding(.horizontal, AppSpacing.sm)
        .padding(.vertical, AppSpacing.xs - 2)
        .background(
            Capsule()
                .fill(AppColor.controlsInactive)
        )
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Status: \(status.displayName)")
    }
}

// MARK: - Primary Action Button

struct PrimaryButton: View {
    let title: String
    let icon: String?
    let isLoading: Bool
    let action: () -> Void
    
    @State private var isPressed = false
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @StateObject private var accessibilityManager = AccessibilityManager()
    
    init(_ title: String, icon: String? = nil, isLoading: Bool = false, action: @escaping () -> Void) {
        self.title = title
        self.icon = icon
        self.isLoading = isLoading
        self.action = action
    }
    
    var body: some View {
        Button(action: {
            AppHaptic.impact(.medium)
            action()
        }) {
            HStack(spacing: adaptiveSpacing) {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .scaleEffect(iconScale)
                } else if let icon {
                    Image(systemName: icon)
                        .font(AppFont.buttonMedium)
                        .scaleEffect(iconScale)
                }
                
                Text(title)
                    .font(AppFont.buttonLarge)
                    .lineLimit(titleLineLimit)
                    .minimumScaleFactor(0.8)
            }
            .semanticForeground(.white)
            .frame(maxWidth: .infinity)
            .frame(height: adaptiveHeight)
            .background(
                RoundedRectangle(cornerRadius: AppRadius.button)
                    .fill(AppColor.brandGradient)
            )
        }
        .scaleEffect(isPressed ? 0.96 : 1.0)
        .animation(accessibilityManager.prefersReducedMotion ? .none : AppAnimation.cardPress, value: isPressed)
        .onLongPressGesture(minimumDuration: 0, maximumDistance: .infinity) { pressing in
            isPressed = pressing
        } perform: {}
        .disabled(isLoading)
        .accessibleTapTarget()
        .enhancedAccessibility(
            label: isLoading ? "\(title), Loading" : title,
            hint: isLoading ? "Please wait" : "Double tap to activate",
            traits: isLoading ? .updatesFrequently : .isButton,
            value: isLoading ? "In progress" : nil
        )
        .adaptiveContrast()
    }
    
    private var adaptiveSpacing: CGFloat {
        switch dynamicTypeSize {
        case .accessibility1, .accessibility2, .accessibility3, .accessibility4, .accessibility5:
            return AppSpacing.md
        case .xxLarge, .xxxLarge:
            return AppSpacing.sm * 1.2
        default:
            return AppSpacing.sm
        }
    }
    
    private var adaptiveHeight: CGFloat {
        switch dynamicTypeSize {
        case .accessibility1, .accessibility2, .accessibility3, .accessibility4, .accessibility5:
            return 64
        case .xxLarge, .xxxLarge:
            return 56
        default:
            return 52
        }
    }
    
    private var iconScale: CGFloat {
        switch dynamicTypeSize {
        case .accessibility1, .accessibility2, .accessibility3, .accessibility4, .accessibility5:
            return 1.2
        case .xxLarge, .xxxLarge:
            return 1.1
        default:
            return 1.0
        }
    }
    
    private var titleLineLimit: Int {
        switch dynamicTypeSize {
        case .accessibility1, .accessibility2, .accessibility3, .accessibility4, .accessibility5:
            return 3
        case .xxLarge, .xxxLarge:
            return 2
        default:
            return 1
        }
    }
}

// MARK: - Secondary Button

struct SecondaryButton: View {
    let title: String
    let icon: String?
    let action: () -> Void
    
    @State private var isPressed = false
    
    init(_ title: String, icon: String? = nil, action: @escaping () -> Void) {
        self.title = title
        self.icon = icon
        self.action = action
    }
    
    var body: some View {
        Button(action: {
            AppHaptic.selection()
            action()
        }) {
            HStack(spacing: AppSpacing.xs) {
                if let icon {
                    Image(systemName: icon)
                        .font(AppFont.buttonSmall)
                }
                Text(title)
                    .font(AppFont.buttonSmall)
            }
            .semanticForeground(AppColor.textSecondary)
            .padding(.horizontal, AppSpacing.sm)
            .padding(.vertical, AppSpacing.xs)
            .background(
                RoundedRectangle(cornerRadius: AppRadius.sm)
                    .fill(AppColor.controlsInactive)
                    .overlay(
                        RoundedRectangle(cornerRadius: AppRadius.sm)
                            .stroke(AppColor.borderHairline, lineWidth: 1)
                    )
            )
        }
        .scaleEffect(isPressed ? 0.95 : 1.0)
        .animation(AppAnimation.microInteraction, value: isPressed)
        .onLongPressGesture(minimumDuration: 0, maximumDistance: .infinity) { pressing in
            isPressed = pressing
        } perform: {}
        .accessibleTapTarget(minSize: 32)
    }
}

// MARK: - Progress Ring

struct ProgressRing: View {
    let progress: Double // 0.0 to 1.0
    let size: CGFloat
    let lineWidth: CGFloat
    
    init(progress: Double, size: CGFloat = 120, lineWidth: CGFloat = 8) {
        self.progress = progress
        self.size = size
        self.lineWidth = lineWidth
    }
    
    var body: some View {
        ZStack {
            // Background ring
            Circle()
                .stroke(AppColor.controlsTrack, lineWidth: lineWidth)
            
            // Progress ring
            Circle()
                .trim(from: 0, to: progress)
                .stroke(
                    AppColor.progressGradient,
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .animation(.spring(response: 0.8, dampingFraction: 0.8), value: progress)
            
            // Center content
            VStack(spacing: 4) {
                Text("\(Int(progress * 100))%")
                    .font(.system(size: size * 0.2, weight: .bold, design: .rounded))
                    .semanticForeground(AppColor.textPrimary)
                
                Text("Complete")
                    .font(.system(size: size * 0.08, weight: .medium))
                    .semanticForeground(AppColor.textMuted)
            }
        }
        .frame(width: size, height: size)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Progress: \(Int(progress * 100)) percent complete")
    }
}

// MARK: - Meeting Card Component

struct MeetingCard: View {
    let title: String
    let subtitle: String
    let duration: String
    let status: MeetingStatus
    let progress: Double?
    let onTap: () -> Void
    let onPlay: () -> Void
    let onTranscript: () -> Void
    let onSummary: () -> Void
    
    @State private var isPressed = false
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @StateObject private var accessibilityManager = AccessibilityManager()
    
    var body: some View {
        Button(action: {
            AppHaptic.selection()
            onTap()
        }) {
            VStack(alignment: .leading, spacing: adaptiveSpacing) {
                // Header
                VStack(alignment: .leading, spacing: AppSpacing.xs) {
                    HStack {
                        Text(title)
                            .font(AppFont.h3)
                            .semanticForeground(AppColor.textPrimary)
                            .multilineTextAlignment(.leading)
                            .lineLimit(titleLineLimit)
                            .minimumScaleFactor(0.9)
                        
                        Spacer()
                        
                        StatusChip(status, animated: status == .recording && !accessibilityManager.prefersReducedMotion)
                    }
                    
                    Text(subtitle)
                        .font(AppFont.caption)
                        .semanticForeground(AppColor.textMuted)
                        .lineLimit(subtitleLineLimit)
                        .minimumScaleFactor(0.8)
                }
                
                // Progress bar (if applicable)
                if let progress {
                    VStack(alignment: .leading, spacing: AppSpacing.xs) {
                        ProgressView(value: progress)
                            .progressViewStyle(LinearProgressViewStyle(tint: status.color))
                            .frame(height: progressBarHeight)
                            .accessibilityValue("\(Int(progress * 100)) percent complete")
                        
                        Text(progressText(for: status, progress: progress))
                            .font(AppFont.caption)
                            .semanticForeground(AppColor.textMuted)
                            .lineLimit(2)
                    }
                }
                
                // Actions row
                HStack {
                    Text(duration)
                        .font(AppFont.caption)
                        .semanticForeground(AppColor.textMuted)
                    
                    Spacer()
                    
                    if status == .completed && !isExtraLargeText {
                        HStack(spacing: AppSpacing.sm) {
                            actionButton("play.fill", "Play recording", onPlay)
                            actionButton("doc.plaintext", "View transcript", onTranscript)
                            actionButton("list.bullet.rectangle", "View summary", onSummary)
                        }
                    }
                }
            }
            .padding(adaptivePadding)
        }
        .cardStyle(isPressed: isPressed)
        .onLongPressGesture(minimumDuration: 0, maximumDistance: .infinity) { pressing in
            isPressed = pressing
        } perform: {}
        .enhancedAccessibility(
            label: accessibilityLabel,
            hint: "Double tap to view meeting details",
            traits: .isButton,
            value: progressValue
        )
        .voiceOverFriendly(sortPriority: 1)
        .adaptiveContrast()
        .respectsMotionPreferences()
    }
    
    private var adaptiveSpacing: CGFloat {
        switch dynamicTypeSize {
        case .accessibility1, .accessibility2, .accessibility3, .accessibility4, .accessibility5:
            return AppSpacing.lg
        case .xxLarge, .xxxLarge:
            return AppSpacing.md * 1.2
        default:
            return AppSpacing.md
        }
    }
    
    private var adaptivePadding: CGFloat {
        switch dynamicTypeSize {
        case .accessibility1, .accessibility2, .accessibility3, .accessibility4, .accessibility5:
            return AppSpacing.lg
        case .xxLarge, .xxxLarge:
            return AppSpacing.md * 1.2
        default:
            return AppSpacing.cardPadding
        }
    }
    
    private var titleLineLimit: Int {
        switch dynamicTypeSize {
        case .accessibility1, .accessibility2, .accessibility3, .accessibility4, .accessibility5:
            return 4
        case .xxLarge, .xxxLarge:
            return 3
        default:
            return 2
        }
    }
    
    private var subtitleLineLimit: Int {
        switch dynamicTypeSize {
        case .accessibility1, .accessibility2, .accessibility3, .accessibility4, .accessibility5:
            return 3
        case .xxLarge, .xxxLarge:
            return 2
        default:
            return 1
        }
    }
    
    private var progressBarHeight: CGFloat {
        switch dynamicTypeSize {
        case .accessibility1, .accessibility2, .accessibility3, .accessibility4, .accessibility5:
            return 8
        case .xxLarge, .xxxLarge:
            return 6
        default:
            return 4
        }
    }
    
    private var isExtraLargeText: Bool {
        switch dynamicTypeSize {
        case .accessibility1, .accessibility2, .accessibility3, .accessibility4, .accessibility5:
            return true
        default:
            return false
        }
    }
    
    private var accessibilityLabel: String {
        let progressInfo = progress != nil ? ", \(Int((progress ?? 0) * 100)) percent complete" : ""
        return "\(title), \(subtitle), Duration: \(duration), Status: \(status.displayName)\(progressInfo)"
    }
    
    private var progressValue: String? {
        guard let progress = progress else { return nil }
        return "\(Int(progress * 100)) percent"
    }
    
    @ViewBuilder
    private func actionButton(_ icon: String, _ label: String, _ action: @escaping () -> Void) -> some View {
        Button(action: {
            AppHaptic.selection()
            action()
        }) {
            Image(systemName: icon)
                .font(.system(size: actionButtonIconSize, weight: .medium))
                .semanticForeground(AppColor.textSecondary)
                .frame(width: actionButtonSize, height: actionButtonSize)
                .background(
                    Circle()
                        .fill(AppColor.controlsInactive)
                )
        }
        .accessibleTapTarget(minSize: 44)
        .enhancedAccessibility(
            label: label,
            hint: "Double tap to \(label.lowercased())",
            traits: .isButton
        )
    }
    
    private var actionButtonSize: CGFloat {
        switch dynamicTypeSize {
        case .accessibility1, .accessibility2, .accessibility3, .accessibility4, .accessibility5:
            return 40
        case .xxLarge, .xxxLarge:
            return 36
        default:
            return 32
        }
    }
    
    private var actionButtonIconSize: CGFloat {
        switch dynamicTypeSize {
        case .accessibility1, .accessibility2, .accessibility3, .accessibility4, .accessibility5:
            return 20
        case .xxLarge, .xxxLarge:
            return 18
        default:
            return 16
        }
    }
    
    private func progressText(for status: MeetingStatus, progress: Double) -> String {
        switch status {
        case .recording:
            return "Recording in progress"
        case .processing:
            return "Transcribing - \(Int(progress * 100))% complete"
        case .completed:
            return "Transcription complete"
        case .idle:
            return "Ready to record"
        }
    }
}

// MARK: - Highlights Widget

struct HighlightsWidget: View {
    let keyTakeaways: [String]
    let onViewFull: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            HStack {
                Text("Key Takeaways")
                    .font(AppFont.h3)
                    .semanticForeground(AppColor.textPrimary)
                
                Spacer()
                
                Button("View Full Summary") {
                    AppHaptic.selection()
                    onViewFull()
                }
                .font(AppFont.caption)
                .semanticForeground(AppColor.brandPurple)
            }
            
            VStack(alignment: .leading, spacing: AppSpacing.xs) {
                ForEach(Array(keyTakeaways.prefix(3).enumerated()), id: \.offset) { _, takeaway in
                    HStack(alignment: .top, spacing: AppSpacing.xs) {
                        Circle()
                            .fill(AppColor.brandPurple)
                            .frame(width: 4, height: 4)
                            .padding(.top, 8)
                        
                        Text(takeaway)
                            .font(AppFont.body)
                            .semanticForeground(AppColor.textSecondary)
                            .multilineTextAlignment(.leading)
                    }
                }
            }
        }
        .padding(AppSpacing.cardPadding)
        .cardStyle()
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Key takeaways from latest meeting")
    }
}

// MARK: - Record Button (Circular FAB)

struct RecordButton: View {
    let isRecording: Bool
    let action: () -> Void
    
    @State private var isPressed = false
    
    var body: some View {
        Button(action: {
            AppHaptic.impact(.heavy)
            action()
        }) {
            ZStack {
                Circle()
                    .fill(AppColor.brandGradient)
                    .frame(width: 64, height: 64)
                    .shadow(
                        color: AppShadow.cardElevation.color,
                        radius: 12,
                        x: 0,
                        y: 6
                    )
                
                Image(systemName: isRecording ? "stop.fill" : "mic.fill")
                    .font(.system(size: 24, weight: .medium))
                    .semanticForeground(.white)
            }
        }
        .scaleEffect(isPressed ? 0.9 : 1.0)
        .animation(AppAnimation.cardPress, value: isPressed)
        .onLongPressGesture(minimumDuration: 0, maximumDistance: .infinity) { pressing in
            isPressed = pressing
        } perform: {}
        .accessibleTapTarget()
        .accessibilityLabel(isRecording ? "Stop recording" : "Start recording")
    }
}

#Preview {
    ZStack {
        AppColor.surfaceBackground.ignoresSafeArea()
        
        VStack(spacing: AppSpacing.lg) {
            StatusChip(.recording, animated: true)
            
            PrimaryButton("Start Recording", icon: "mic.fill") {}
            
            SecondaryButton("View Summary", icon: "list.bullet.rectangle") {}
            
            ProgressRing(progress: 0.67)
            
            MeetingCard(
                title: "Team Standup",
                subtitle: "Today • 15 min",
                duration: "15:30",
                status: .processing,
                progress: 0.45,
                onTap: {},
                onPlay: {},
                onTranscript: {},
                onSummary: {}
            )
            
            RecordButton(isRecording: false) {}
        }
        .padding()
    }
}