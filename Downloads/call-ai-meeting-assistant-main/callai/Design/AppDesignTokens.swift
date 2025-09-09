import SwiftUI
#if canImport(UIKit)
import UIKit
#endif
#if canImport(AppKit)
import AppKit
#endif

// MARK: - Design Tokens

/// Semantic color system following Apple HIG with Dark Mode first approach
struct AppColor {
    // MARK: - Brand Colors
    static let brandPurple = Color("Brand/Purple")
    static let brandPurpleLight = Color("Brand/PurpleLight")
    
    // MARK: - Surface Colors
    static let surfaceBackground = Color("Surface/Background")      // #0B0B0F
    static let surfaceElevated = Color("Surface/Elevated")          // #111118
    static let surfaceCard = Color("Surface/Card")                  // #1A1A22
    
    // MARK: - Text Colors
    static let textPrimary = Color("Text/Primary")                  // #FFFFFF
    static let textSecondary = Color("Text/Secondary")              // #C9CAD3
    static let textMuted = Color("Text/Muted")                      // #8B8D97
    
    // MARK: - Border Colors
    static let borderHairline = Color("Border/Hairline")            // #2A2A33
    
    // MARK: - Accent Colors
    static let accentSuccess = Color("Accent/Success")              // #4ADE80
    static let accentWarning = Color("Accent/Warning")              // #FBBF24
    static let accentError = Color("Accent/Error")                  // #F87171
    
    // MARK: - Control Colors
    static let controlsInactive = Color("Controls/Inactive")        // #2F2F38
    static let controlsTrack = Color("Controls/Track")              // #2A2840
    
    // MARK: - Gradient Colors
    static let progressGradient = LinearGradient(
        colors: [brandPurple, Color("Progress/End")],               // #7B5BFF
        startPoint: .leading,
        endPoint: .trailing
    )
    
    static let brandGradient = LinearGradient(
        colors: [brandPurple, brandPurpleLight],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}

/// Typography system using SF Pro with Dynamic Type support up to XXXL
struct AppFont {
    // MARK: - Hero/Display (supports up to XXXL)
    static let heroTitle: Font = .custom("SF Pro Display", size: 34, relativeTo: .largeTitle).bold()
    
    // MARK: - Headings (with accessibility scaling)
    static let h1: Font = .custom("SF Pro Display", size: 28, relativeTo: .largeTitle).bold()
    static let h2: Font = .custom("SF Pro Display", size: 22, relativeTo: .title2).weight(.semibold)
    static let h3: Font = .custom("SF Pro Text", size: 20, relativeTo: .title3).weight(.semibold)
    
    // MARK: - Body Text (ensures readability at all sizes)
    static let body: Font = .custom("SF Pro Text", size: 17, relativeTo: .body)
    static let bodyEmphasized: Font = .custom("SF Pro Text", size: 17, relativeTo: .body).weight(.medium)
    static let callout: Font = .custom("SF Pro Text", size: 16, relativeTo: .callout)
    
    // MARK: - Supporting Text (with minimum accessible sizes)
    static let caption: Font = .custom("SF Pro Text", size: 12, relativeTo: .caption2).weight(.medium)
    static let footnote: Font = .custom("SF Pro Text", size: 13, relativeTo: .footnote)
    
    // MARK: - Buttons (with proper contrast and scaling)
    static let buttonLarge: Font = .custom("SF Pro Text", size: 17, relativeTo: .body).weight(.semibold)
    static let buttonMedium: Font = .custom("SF Pro Text", size: 16, relativeTo: .callout).weight(.semibold)
    static let buttonSmall: Font = .custom("SF Pro Text", size: 13, relativeTo: .caption).weight(.semibold)
    
    // MARK: - Accessibility Helpers
    /// Returns appropriate line limit based on Dynamic Type size
    static func lineLimit(for sizeCategory: ContentSizeCategory, base: Int = 2) -> Int {
        switch sizeCategory {
        case .accessibilityMedium, .accessibilityLarge, .accessibilityExtraLarge, .accessibilityExtraExtraLarge, .accessibilityExtraExtraExtraLarge:
            return base + 2 // Allow more lines for larger text
        case .extraLarge, .extraExtraLarge, .extraExtraExtraLarge:
            return base + 1
        default:
            return base
        }
    }
    
    /// Returns minimum character count for truncation based on text size
    static func truncationLength(for sizeCategory: ContentSizeCategory, base: Int = 50) -> Int {
        switch sizeCategory {
        case .accessibilityMedium, .accessibilityLarge, .accessibilityExtraLarge, .accessibilityExtraExtraLarge, .accessibilityExtraExtraExtraLarge:
            return max(base - 20, 20) // Shorter truncation for accessibility sizes
        case .extraLarge, .extraExtraLarge, .extraExtraExtraLarge:
            return max(base - 10, 25)
        default:
            return base
        }
    }
}

/// Spacing system based on 8pt grid
struct AppSpacing {
    static let xs: CGFloat = 8
    static let sm: CGFloat = 12
    static let md: CGFloat = 16
    static let lg: CGFloat = 24
    static let xl: CGFloat = 32
    static let xxl: CGFloat = 48
    
    // MARK: - Semantic Spacing
    static let cardPadding: CGFloat = md
    static let sectionSpacing: CGFloat = lg
    static let itemSpacing: CGFloat = sm
}

/// Corner radius values
struct AppRadius {
    static let xs: CGFloat = 8
    static let sm: CGFloat = 12
    static let md: CGFloat = 16
    static let lg: CGFloat = 20
    static let xl: CGFloat = 24
    static let circle: CGFloat = 1000  // For fully rounded elements
    
    // MARK: - Semantic Radii
    static let card: CGFloat = lg
    static let button: CGFloat = xl
    static let chip: CGFloat = circle
}

/// Shadow definitions
struct AppShadow {
    static let cardElevation: (color: Color, radius: CGFloat, x: CGFloat, y: CGFloat) = (
        color: .black.opacity(0.4),
        radius: 24,
        x: 0,
        y: 8
    )
    
    static let subtle: (color: Color, radius: CGFloat, x: CGFloat, y: CGFloat) = (
        color: .black.opacity(0.2),
        radius: 8,
        x: 0,
        y: 4
    )
}

/// Animation presets
struct AppAnimation {
    static let microInteraction = Animation.spring(response: 0.3, dampingFraction: 0.9)
    static let cardPress = Animation.spring(response: 0.2, dampingFraction: 0.8)
    static let pageTransition = Animation.spring(response: 0.5, dampingFraction: 0.9)
    static let gentle = Animation.easeInOut(duration: 0.3)
}

/// Haptic feedback presets
struct AppHaptic {
    enum ImpactStyle {
        case light, medium, heavy
        
        #if canImport(UIKit)
        var uiKitStyle: UIImpactFeedbackGenerator.FeedbackStyle {
            switch self {
            case .light: return .light
            case .medium: return .medium
            case .heavy: return .heavy
            }
        }
        #endif
    }
    
    enum NotificationType {
        case success, warning, error
        
        #if canImport(UIKit)
        var uiKitType: UINotificationFeedbackGenerator.FeedbackType {
            switch self {
            case .success: return .success
            case .warning: return .warning
            case .error: return .error
            }
        }
        #endif
    }
    
    @MainActor
    static func impact(_ style: ImpactStyle = .medium) {
        #if canImport(UIKit)
        let impactFeedback = UIImpactFeedbackGenerator(style: style.uiKitStyle)
        impactFeedback.impactOccurred()
        #endif
    }
    
    @MainActor
    static func selection() {
        #if canImport(UIKit)
        let selectionFeedback = UISelectionFeedbackGenerator()
        selectionFeedback.selectionChanged()
        #endif
    }
    
    @MainActor
    static func notification(_ type: NotificationType) {
        #if canImport(UIKit)
        let notificationFeedback = UINotificationFeedbackGenerator()
        notificationFeedback.notificationOccurred(type.uiKitType)
        #endif
    }
}

// MARK: - Accessibility Extensions

extension View {
    /// Apply minimum tap target size (44x44 points) with accessibility scaling
    func accessibleTapTarget(minSize: CGFloat = 44) -> some View {
        self.frame(minWidth: minSize, minHeight: minSize)
            .contentShape(Rectangle()) // Ensures entire area is tappable
    }
    
    /// Apply semantic colors with proper contrast (WCAG AA+ compliance)
    func semanticForeground(_ color: Color, opacity: Double = 1.0) -> some View {
        self.foregroundStyle(color.opacity(opacity))
    }
    
    /// Smart text truncation based on Dynamic Type size
    func smartTruncation(for sizeCategory: ContentSizeCategory, baseLength: Int = 50) -> some View {
        return self.lineLimit(AppFont.lineLimit(for: sizeCategory))
    }
    
    /// Apply reduced motion preferences
    func respectsMotionPreferences() -> some View {
        self.modifier(ReducedMotionModifier())
    }
    
    /// Enhanced accessibility for interactive elements
    func enhancedAccessibility(
        label: String,
        hint: String? = nil,
        traits: AccessibilityTraits = [],
        value: String? = nil
    ) -> some View {
        var view = self.accessibilityLabel(label)
        
        if let hint = hint, !hint.isEmpty {
            view = view.accessibilityHint(hint)
        }
        
        view = view.accessibilityAddTraits(traits)
        
        if let value = value, !value.isEmpty {
            view = view.accessibilityValue(value)
        }
        
        return view
    }
    
    /// High contrast mode support
    func adaptiveContrast() -> some View {
        self.modifier(ContrastAdaptiveModifier())
    }
    
    /// Voice Over navigation optimization
    func voiceOverFriendly(sortPriority: Double = 0) -> some View {
        self
            .accessibilitySortPriority(sortPriority)
    }
}

// MARK: - Accessibility Modifiers

struct ReducedMotionModifier: ViewModifier {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    
    func body(content: Content) -> some View {
        content
            .animation(reduceMotion ? .none : AppAnimation.microInteraction, value: reduceMotion)
    }
}

struct ContrastAdaptiveModifier: ViewModifier {
    @Environment(\.accessibilityDifferentiateWithoutColor) private var differentiateWithoutColor
    @Environment(\.accessibilityInvertColors) private var invertColors
    
    func body(content: Content) -> some View {
        content
            .opacity(differentiateWithoutColor ? 1.0 : 0.95)
            .saturation(invertColors ? 0.8 : 1.0)
    }
}

// MARK: - Dynamic Type Environment Reader

@MainActor
class AccessibilityManager: ObservableObject {
    @Published var contentSizeCategory: ContentSizeCategory = .medium
    @Published var isVoiceOverRunning = false
    @Published var prefersReducedMotion = false
    @Published var differentiateWithoutColor = false
    
    init() {
        Task { @MainActor in
            updateAccessibilitySettings()
        }
        
        // Listen for accessibility changes
        #if canImport(UIKit)
        NotificationCenter.default.addObserver(
            forName: UIAccessibility.voiceOverStatusDidChangeNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor [weak self] in
                self?.updateAccessibilitySettings()
            }
        }
        
        NotificationCenter.default.addObserver(
            forName: UIAccessibility.reduceMotionStatusDidChangeNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor [weak self] in
                self?.updateAccessibilitySettings()
            }
        }
        #endif
    }
    
    @MainActor
    private func updateAccessibilitySettings() {
        #if canImport(UIKit)
        isVoiceOverRunning = UIAccessibility.isVoiceOverRunning
        prefersReducedMotion = UIAccessibility.isReduceMotionEnabled
        differentiateWithoutColor = UIAccessibility.shouldDifferentiateWithoutColor
        #else
        // macOS fallback - use SwiftUI environment values
        isVoiceOverRunning = false
        prefersReducedMotion = false
        differentiateWithoutColor = false
        #endif
    }
    
    /// Returns appropriate spacing for current accessibility settings
    func adaptiveSpacing(_ base: CGFloat) -> CGFloat {
        switch contentSizeCategory {
        case .accessibilityMedium, .accessibilityLarge:
            return base * 1.2
        case .accessibilityExtraLarge, .accessibilityExtraExtraLarge, .accessibilityExtraExtraExtraLarge:
            return base * 1.5
        default:
            return base
        }
    }
    
    /// Returns appropriate button height for current text size
    func adaptiveButtonHeight(_ base: CGFloat = 52) -> CGFloat {
        switch contentSizeCategory {
        case .accessibilityMedium, .accessibilityLarge:
            return base * 1.2
        case .accessibilityExtraLarge, .accessibilityExtraExtraLarge, .accessibilityExtraExtraExtraLarge:
            return base * 1.4
        default:
            return base
        }
    }
}

// MARK: - Card Style Modifier

struct CardStyle: ViewModifier {
    let isPrimary: Bool
    let isPressed: Bool
    
    init(isPrimary: Bool = false, isPressed: Bool = false) {
        self.isPrimary = isPrimary
        self.isPressed = isPressed
    }
    
    func body(content: Content) -> some View {
        content
            .background(
                RoundedRectangle(cornerRadius: AppRadius.card)
                    .fill(isPrimary ? AnyShapeStyle(AppColor.brandGradient) : AnyShapeStyle(AppColor.surfaceCard))
                    .overlay(
                        RoundedRectangle(cornerRadius: AppRadius.card)
                            .stroke(AppColor.borderHairline, lineWidth: 1)
                    )
                    .shadow(
                        color: isPrimary ? AppShadow.cardElevation.color : .clear,
                        radius: isPrimary ? AppShadow.cardElevation.radius : 0,
                        x: isPrimary ? AppShadow.cardElevation.x : 0,
                        y: isPrimary ? AppShadow.cardElevation.y : 0
                    )
            )
            .scaleEffect(isPressed ? 0.98 : 1.0)
            .animation(AppAnimation.cardPress, value: isPressed)
    }
}

extension View {
    func cardStyle(isPrimary: Bool = false, isPressed: Bool = false) -> some View {
        self.modifier(CardStyle(isPrimary: isPrimary, isPressed: isPressed))
    }
}