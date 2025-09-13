import SwiftUI
import AppKit

struct SuccessView: View {
    let projectPath: String
    let projectName: String
    let template: Template?
    let githubURL: String
    let vercelDeploymentURL: String
    let onDismiss: () -> Void
    
    @State private var availableEditors: [Editor] = []
    @State private var showingCopyConfirmation = false
    @State private var showingCopyVercelConfirmation = false
    
    init(projectPath: String, projectName: String = "", template: Template? = nil, 
         githubURL: String = "", vercelDeploymentURL: String = "", onDismiss: @escaping () -> Void) {
        self.projectPath = projectPath
        self.projectName = projectName.isEmpty ? URL(fileURLWithPath: projectPath).lastPathComponent : projectName
        self.template = template
        self.githubURL = githubURL
        self.vercelDeploymentURL = vercelDeploymentURL
        self.onDismiss = onDismiss
    }
    
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 60))
                .foregroundColor(.green)
            
            Text("Project Created Successfully!")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            Text(projectPath)
                .font(.caption)
                .foregroundColor(.secondary)
                .lineLimit(2)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            Divider()
            
            VStack(spacing: 15) {
                // Vercel Deployment URL (if deployed)
                if !vercelDeploymentURL.isEmpty {
                    VStack(spacing: 10) {
                        HStack {
                            Image(systemName: "triangle.fill")
                                .foregroundColor(.black)
                            Text("Deployed to Vercel")
                                .fontWeight(.medium)
                        }
                        
                        Text(vercelDeploymentURL)
                            .font(.caption)
                            .foregroundColor(.blue)
                            .onTapGesture {
                                NSWorkspace.shared.open(URL(string: vercelDeploymentURL)!)
                            }
                        
                        HStack(spacing: 10) {
                            Button(action: {
                                NSWorkspace.shared.open(URL(string: vercelDeploymentURL)!)
                            }) {
                                Label("Open in Browser", systemImage: "safari")
                                    .frame(width: 140)
                            }
                            .buttonStyle(.borderedProminent)
                            
                            Button(action: copyVercelURL) {
                                Label(showingCopyVercelConfirmation ? "Copied!" : "Copy URL", systemImage: "doc.on.doc")
                                    .frame(width: 100)
                            }
                            .buttonStyle(.bordered)
                        }
                    }
                    .padding()
                    .background(Color.green.opacity(0.1))
                    .cornerRadius(8)
                    
                    Divider()
                }
                
                // Open in Finder
                Button(action: openInFinder) {
                    Label("Open in Finder", systemImage: "folder")
                        .frame(width: 200)
                }
                .buttonStyle(.bordered)
                
                // Open in Editors
                ForEach(availableEditors, id: \.self) { editor in
                    Button(action: { openInEditor(editor) }) {
                        Label("Open in \(editor.rawValue)", systemImage: editorIcon(for: editor))
                            .frame(width: 200)
                    }
                    .buttonStyle(.borderedProminent)
                }
                
                // Copy Path
                Button(action: copyPath) {
                    Label(showingCopyConfirmation ? "Copied!" : "Copy Path", systemImage: "doc.on.doc")
                        .frame(width: 200)
                }
                .buttonStyle(.bordered)
            }
            
            Spacer()
            
            HStack(spacing: 10) {
                Button("View in Recent Projects") {
                    // Dismiss and switch to recent projects tab
                    NotificationCenter.default.post(name: Notification.Name("SwitchToRecentProjects"), object: nil)
                    onDismiss()
                }
                .buttonStyle(.bordered)
                
                Button("Done") {
                    onDismiss()
                }
                .buttonStyle(.borderedProminent)
                .keyboardShortcut(.defaultAction)
            }
        }
        .padding(30)
        .frame(width: 400, height: vercelDeploymentURL.isEmpty ? 500 : 600)
        .onAppear {
            checkAvailableEditors()
            saveProjectToHistory()
            
            // Auto-open in editor if enabled
            if SettingsService.shared.settings.openInEditorAfterCreation {
                if let preferredEditor = availableEditors.first(where: { $0 == SettingsService.shared.settings.preferredEditor }) {
                    Task {
                        try? await ShellExecutor.openInEditor(projectPath: projectPath, editor: preferredEditor)
                    }
                }
            }
        }
    }
    
    func checkAvailableEditors() {
        availableEditors = Editor.allCases.filter { editor in
            ShellExecutor.checkEditorInstalled(editor: editor)
        }
    }
    
    func openInFinder() {
        NSWorkspace.shared.selectFile(nil, inFileViewerRootedAtPath: projectPath)
    }
    
    func openInEditor(_ editor: Editor) {
        Task {
            do {
                try await ShellExecutor.openInEditor(projectPath: projectPath, editor: editor)
                await MainActor.run {
                    onDismiss()
                }
            } catch {
                await MainActor.run {
                    // Show error alert
                    let alert = NSAlert()
                    alert.messageText = "Failed to open \(editor.rawValue)"
                    alert.informativeText = """
                    \(error.localizedDescription)
                    
                    If \(editor.rawValue) is installed, you may need to:
                    1. Grant automation permissions to Template Manager
                    2. Open System Settings > Privacy & Security > Automation
                    3. Allow Template Manager to control \(editor.rawValue)
                    
                    Alternatively, you can manually open \(editor.rawValue) and then open the project folder.
                    """
                    alert.alertStyle = .warning
                    alert.addButton(withTitle: "OK")
                    alert.addButton(withTitle: "Copy Project Path")
                    
                    let response = alert.runModal()
                    if response == .alertSecondButtonReturn {
                        // Copy path button was clicked
                        copyPath()
                    }
                }
            }
        }
    }
    
    func copyPath() {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(projectPath, forType: .string)
        
        withAnimation {
            showingCopyConfirmation = true
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            withAnimation {
                showingCopyConfirmation = false
            }
        }
    }
    
    func editorIcon(for editor: Editor) -> String {
        switch editor {
        case .vscode:
            return "chevron.left.forwardslash.chevron.right"
        case .cursor:
            return "cursorarrow"
        case .claude:
            return "brain"
        }
    }
    
    func copyVercelURL() {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(vercelDeploymentURL, forType: .string)
        
        withAnimation {
            showingCopyVercelConfirmation = true
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            withAnimation {
                showingCopyVercelConfirmation = false
            }
        }
    }
    
    func saveProjectToHistory() {
        guard let template = template else { return }
        
        // Get template metadata
        let enhanced = TemplateMetadataService.shared.enhanceTemplate(template)
        let templateIcon = enhanced?.icon ?? "folder"
        let templateDisplayName = enhanced?.displayName ?? template.name
        
        // Save to project history
        ProjectHistoryService.shared.addProject(
            name: projectName,
            path: projectPath,
            templateName: templateDisplayName,
            templateIcon: templateIcon,
            githubURL: githubURL.isEmpty ? nil : githubURL,
            vercelURL: vercelDeploymentURL.isEmpty ? nil : vercelDeploymentURL
        )
    }
}