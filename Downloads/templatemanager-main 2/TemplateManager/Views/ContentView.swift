import SwiftUI

struct ContentView: View {
    @StateObject private var templateService = TemplateService()
    @StateObject private var githubService = GitHubService.shared
    @StateObject private var vercelService = VercelService.shared
    @StateObject private var settingsService = SettingsService.shared
    @State private var selectedTemplate: Template?
    @State private var projectName = ""
    @State private var projectLocation: URL = SettingsService.shared.getDefaultProjectURL()
    @State private var isCreatingProject = false
    @State private var showingSuccess = false
    @State private var showingError = false
    @State private var errorMessage = ""
    @State private var createdProjectPath = ""
    @State private var createdProjectName = ""
    @State private var createdProjectTemplate: Template?
    @State private var createdGitHubURL = ""
    @State private var outputLog = ""
    @State private var showingTemplateGallery = false
    @State private var showingGitHubSettings = false
    @State private var showingVercelSettings = false
    @State private var showingSettings = false
    
    // GitHub options
    @State private var createGitHubRepository = false
    @State private var isPrivateRepository = false
    
    // Vercel options
    @State private var deployToVercel = false
    @State private var vercelIsProduction = false
    @State private var vercelDeploymentURL = ""
    
    // Template variables
    @State private var templateVariableValues: [TemplateVariableValue] = []
    
    // Environment variables
    @State private var environmentVariables: [EnvironmentVariable] = []
    
    private var scriptPath: String {
        if let resourcePath = Bundle.main.resourcePath {
            return (resourcePath as NSString).appendingPathComponent("Scripts/setup-from-config.sh")
        }
        return "/Users/ekodevapps/Desktop/template-manager/setup-from-config.sh"
    }
    
    private var specialScripts: [String: String] {
        if let resourcePath = Bundle.main.resourcePath {
            return [
                "nextjs-google-auth": (resourcePath as NSString).appendingPathComponent("Scripts/setup-nextjs-auth.sh")
            ]
        }
        return [
            "nextjs-google-auth": "/Users/ekodevapps/Desktop/template-manager/setup-nextjs-auth.sh"
        ]
    }
    
    @State private var selectedTab = 0
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            VStack(spacing: 10) {
                HStack(alignment: .top) {
                    // Integration Buttons - Left side
                    HStack(spacing: 10) {
                        // GitHub Integration Button
                        if githubService.isAuthenticated {
                            Button(action: { showingGitHubSettings.toggle() }) {
                                Label {
                                    Text("GitHub")
                                        .fontWeight(.medium)
                                } icon: {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundColor(.green)
                                }
                            }
                            .buttonStyle(.bordered)
                            .controlSize(.regular)
                        } else {
                            Button(action: { showingGitHubSettings.toggle() }) {
                                Label {
                                    Text("GitHub")
                                } icon: {
                                    Image(systemName: "link.circle")
                                }
                            }
                            .buttonStyle(.borderedProminent)
                            .controlSize(.regular)
                        }
                        
                        // Vercel Integration Button
                        if vercelService.isAuthenticated {
                            Button(action: { showingVercelSettings.toggle() }) {
                                Label {
                                    Text("Vercel")
                                        .fontWeight(.medium)
                                } icon: {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundColor(.green)
                                }
                            }
                            .buttonStyle(.bordered)
                            .controlSize(.regular)
                        } else {
                            Button(action: { showingVercelSettings.toggle() }) {
                                Label {
                                    Text("Vercel")
                                } icon: {
                                    Image(systemName: "triangle.fill")
                                }
                            }
                            .buttonStyle(.borderedProminent)
                            .controlSize(.regular)
                        }
                    }
                    
                    Spacer()
                    
                    VStack(spacing: 2) {
                        Text("Template Manager")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                        
                        Text("Create new projects from templates")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    // Settings Button - Right side
                    Button(action: { showingSettings.toggle() }) {
                        Label {
                            Text("Settings")
                        } icon: {
                            Image(systemName: "gearshape")
                        }
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.regular)
                }
                
                Divider()
            }
            .padding(.horizontal, 30)
            .padding(.top, 20)
            .padding(.bottom, 10)
            .sheet(isPresented: $showingGitHubSettings) {
                GitHubSettingsView()
            }
            .sheet(isPresented: $showingVercelSettings) {
                VercelSettingsView()
            }
            .sheet(isPresented: $showingSettings) {
                SettingsView()
            }
            
            // Tab Selection
            Picker("", selection: $selectedTab) {
                Label("Create New", systemImage: "plus.square").tag(0)
                Label("Recent Projects", systemImage: "clock.arrow.circlepath").tag(1)
            }
            .pickerStyle(.segmented)
            .padding(.horizontal, 30)
            .padding(.bottom, 10)
            
            Divider()
            
            // Main content based on selected tab
            if selectedTab == 0 {
                // Create New Project View
                ScrollView {
                VStack(spacing: 20) {
            
            // Template Selection
            VStack(alignment: .leading, spacing: 10) {
                Text("Template")
                    .font(.headline)
                
                HStack {
                    if let template = selectedTemplate,
                       let enhanced = TemplateMetadataService.shared.enhanceTemplate(template) {
                        // Selected template card
                        HStack {
                            Image(systemName: enhanced.icon)
                                .font(.title3)
                                .foregroundColor(.blue)
                            
                            VStack(alignment: .leading, spacing: 2) {
                                Text(enhanced.displayName)
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                Text(enhanced.category.displayName)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            
                            Spacer()
                            
                            Button("Change") {
                                showingTemplateGallery = true
                            }
                            .buttonStyle(.link)
                        }
                        .padding(12)
                        .background(Color.blue.opacity(0.1))
                        .cornerRadius(8)
                    } else {
                        // No template selected
                        Button(action: { showingTemplateGallery = true }) {
                            HStack {
                                Image(systemName: "square.grid.2x2")
                                Text("Browse Templates")
                                Spacer()
                                Image(systemName: "chevron.right")
                            }
                            .padding(12)
                            .frame(maxWidth: .infinity)
                            .background(Color.gray.opacity(0.1))
                            .cornerRadius(8)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            
            // Project Name
            VStack(alignment: .leading, spacing: 10) {
                Text("Project Name")
                    .font(.headline)
                
                TextField("my-awesome-project", text: $projectName)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
            }
            
            // Location
            VStack(alignment: .leading, spacing: 10) {
                Text("Location")
                    .font(.headline)
                
                HStack {
                    Text(projectLocation.path)
                        .lineLimit(1)
                        .truncationMode(.middle)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(8)
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(5)
                    
                    Button("Choose...") {
                        selectLocation()
                    }
                }
            }
            
                    // Template Variables (if any)
                    if let template = selectedTemplate, 
                       let variables = template.variables, 
                       !variables.isEmpty {
                        TemplateVariablesView(
                            template: template,
                            variableValues: $templateVariableValues
                        )
                    }
            
                    // Deployment Options
                    VStack(alignment: .leading, spacing: 15) {
                        Text("Deployment Options")
                            .font(.headline)
                        
                        // GitHub Repository
                        if githubService.isAuthenticated {
                            VStack(alignment: .leading, spacing: 10) {
                                Toggle(isOn: $createGitHubRepository) {
                                    HStack {
                                        Image(systemName: "arrow.triangle.branch")
                                        Text("Create GitHub Repository")
                                    }
                                }
                                
                                if createGitHubRepository {
                                    Toggle(isOn: $isPrivateRepository) {
                                        HStack {
                                            Image(systemName: "lock")
                                            Text("Private Repository")
                                        }
                                    }
                                    .padding(.leading, 25)
                                }
                            }
                            .padding()
                            .background(Color.gray.opacity(0.05))
                            .cornerRadius(8)
                        }
                        
                        // Vercel Deployment
                        if vercelService.isAuthenticated && isVercelCompatibleTemplate(selectedTemplate) {
                            VStack(alignment: .leading, spacing: 10) {
                                Toggle(isOn: $deployToVercel) {
                                    HStack {
                                        Image(systemName: "triangle.fill")
                                        Text("Deploy to Vercel")
                                    }
                                }
                                
                                if deployToVercel {
                                    Toggle(isOn: $vercelIsProduction) {
                                        HStack {
                                            Image(systemName: "checkmark.shield")
                                            Text("Production Deployment")
                                        }
                                    }
                                    .padding(.leading, 25)
                                }
                            }
                            .padding()
                            .background(Color.gray.opacity(0.05))
                            .cornerRadius(8)
                        }
                    }
                    
                    // Environment Variables
                    EnvironmentVariablesView(
                        environmentVariables: $environmentVariables,
                        template: selectedTemplate
                    )
            
                    // Template Details
                    if let template = selectedTemplate,
                       let enhanced = TemplateMetadataService.shared.enhanceTemplate(template) {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Template Details")
                                .font(.headline)
                            
                            Text(enhanced.description)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            
                            // Features list
                            VStack(alignment: .leading, spacing: 6) {
                                ForEach(enhanced.features.prefix(3), id: \.self) { feature in
                                    HStack {
                                        Image(systemName: "checkmark.circle.fill")
                                            .font(.caption)
                                            .foregroundColor(.green)
                                        Text(feature)
                                            .font(.caption)
                                    }
                                }
                            }
                        }
                        .padding()
                        .background(Color.gray.opacity(0.05))
                        .cornerRadius(8)
                    }
                    
                    // Output Log (if creating)
                    if !outputLog.isEmpty {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Output")
                                .font(.headline)
                            
                            ScrollView {
                                Text(outputLog)
                                    .font(.system(.caption, design: .monospaced))
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .padding(8)
                            }
                            .frame(height: 100)
                            .background(Color.gray.opacity(0.1))
                            .cornerRadius(5)
                        }
                    }
                }
                .padding(.horizontal, 30)
                .padding(.vertical, 10)
            }
            
            // Create Button - Always visible at bottom
            VStack {
                Divider()
                
                Button(action: createProject) {
                    if isCreatingProject {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle())
                            .scaleEffect(0.8)
                    } else {
                        Text("Create Project")
                    }
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .disabled(selectedTemplate == nil || projectName.isEmpty || isCreatingProject)
                .padding()
            }
            .background(Color(NSColor.windowBackgroundColor))
            } else {
                // Recent Projects View
                RecentProjectsView()
            }
        }
        .sheet(isPresented: $showingSuccess) {
            SuccessView(
                projectPath: createdProjectPath,
                projectName: createdProjectName,
                template: createdProjectTemplate,
                githubURL: createdGitHubURL,
                vercelDeploymentURL: vercelDeploymentURL,
                onDismiss: {
                    showingSuccess = false
                    // Reset form
                    projectName = ""
                    selectedTemplate = nil
                    outputLog = ""
                    createGitHubRepository = false
                    isPrivateRepository = false
                    deployToVercel = false
                    vercelIsProduction = false
                    vercelDeploymentURL = ""
                    createdProjectName = ""
                    createdProjectTemplate = nil
                    createdGitHubURL = ""
                    environmentVariables = []
                }
            )
        }
        .sheet(isPresented: $showingTemplateGallery) {
            TemplateGalleryView(
                selectedTemplate: $selectedTemplate,
                onDismiss: { showingTemplateGallery = false }
            )
        }
        .onChange(of: selectedTemplate) { newTemplate in
            // Initialize template variables when template changes
            if let template = newTemplate,
               let variables = template.variables {
                templateVariableValues = variables.map { variable in
                    TemplateVariableValue(
                        id: variable.id,
                        variable: variable,
                        value: variable.defaultValue ?? ""
                    )
                }
            } else {
                templateVariableValues = []
            }
        }
        .alert("Error", isPresented: $showingError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
        .onReceive(NotificationCenter.default.publisher(for: Notification.Name("SwitchToRecentProjects"))) { _ in
            selectedTab = 1
        }
        .onAppear {
            // Initialize project location from settings
            projectLocation = settingsService.getDefaultProjectURL()
        }
    }
    
    func selectLocation() {
        let panel = NSOpenPanel()
        panel.canChooseFiles = false
        panel.canChooseDirectories = true
        panel.allowsMultipleSelection = false
        panel.canCreateDirectories = true
        
        if panel.runModal() == .OK {
            projectLocation = panel.url ?? projectLocation
        }
    }
    
    func createProject() {
        guard let template = selectedTemplate else { return }
        
        isCreatingProject = true
        outputLog = "Creating project structure...\n"
        
        Task {
            do {
                // Create project configuration
                let configuration = ProjectConfiguration(
                    template: template,
                    projectName: projectName,
                    location: projectLocation,
                    createGitHubRepository: createGitHubRepository,
                    isPrivateRepository: isPrivateRepository,
                    deployToVercel: deployToVercel,
                    vercelIsProduction: vercelIsProduction,
                    templateVariables: templateVariableValues.toReplacementDictionary()
                )
                
                await MainActor.run {
                    outputLog += "📁 Creating directories...\n"
                }
                
                // Use the new ProjectCreator with configuration
                try await ProjectCreator.createProject(configuration: configuration)
                
                // Create environment files if we have environment variables
                if !environmentVariables.isEmpty {
                    await MainActor.run {
                        outputLog += "\n🔐 Creating environment files...\n"
                    }
                    
                    try await createEnvironmentFiles(at: createdProjectPath)
                    
                    await MainActor.run {
                        outputLog += "✅ Environment files created\n"
                    }
                }
                
                await MainActor.run {
                    outputLog += "✅ Project structure created!\n"
                    outputLog += "📝 Generated \(template.files.count) files\n"
                    
                    if createGitHubRepository {
                        outputLog += "🔗 Created GitHub repository\n"
                    }
                    
                    createdProjectPath = configuration.location.appendingPathComponent(projectName).path
                    createdProjectName = projectName
                    createdProjectTemplate = template
                    createdGitHubURL = "" // Will be updated if GitHub repo is created
                }
                
                // Deploy to Vercel if requested
                if deployToVercel && vercelService.isAuthenticated {
                    await MainActor.run {
                        outputLog += "🚀 Deploying to Vercel...\n"
                    }
                    
                    let vercelConfig = VercelConfiguration(
                        projectName: projectName,
                        isProduction: vercelIsProduction
                    )
                    
                    let deployment = try await vercelService.deployProject(
                        at: createdProjectPath,
                        configuration: vercelConfig
                    )
                    
                    await MainActor.run {
                        outputLog += "✅ Deployed to Vercel!\n"
                        outputLog += "🌐 URL: \(deployment.url)\n"
                        vercelDeploymentURL = deployment.url
                    }
                }
                
                // Install dependencies if enabled in settings
                if settingsService.settings.autoInstallDependencies {
                    await MainActor.run {
                        outputLog += "\n📦 Installing dependencies with \(settingsService.settings.packageManager.displayName)...\n"
                    }
                    
                    do {
                        let installResult = try await ShellExecutor.execute(
                            script: "cd \"\(createdProjectPath)\" && \(settingsService.settings.packageManager.installCommand)"
                        )
                        
                        await MainActor.run {
                            if !installResult.output.isEmpty {
                                outputLog += installResult.output + "\n"
                            }
                            if !installResult.error.isEmpty && !installResult.error.contains("npm notice") {
                                outputLog += "⚠️ Warnings: \(installResult.error)\n"
                            }
                            outputLog += "✅ Dependencies installed successfully!\n"
                        }
                        
                        // Run dev server if enabled
                        if settingsService.settings.autoRunDevServer {
                            await MainActor.run {
                                outputLog += "\n🚀 Starting development server...\n"
                                outputLog += "Note: The dev server is running in the background.\n"
                                outputLog += "You can stop it from the terminal when needed.\n"
                            }
                            
                            // Start dev server in background
                            Task {
                                let devScript = """
                                osascript -e 'tell application "Terminal"
                                    activate
                                    do script "cd \\\"\(createdProjectPath)\\\" && npm run dev"
                                end tell'
                                """
                                try? await ShellExecutor.execute(script: devScript)
                            }
                        }
                    } catch {
                        await MainActor.run {
                            outputLog += "❌ Failed to install dependencies: \(error.localizedDescription)\n"
                        }
                    }
                }
                
                await MainActor.run {
                    if !settingsService.settings.autoInstallDependencies {
                        outputLog += "\nNext steps:\n"
                        outputLog += "1. cd \(projectName)\n"
                        outputLog += "2. \(settingsService.settings.packageManager.installCommand)\n"
                        outputLog += "3. npm run dev\n"
                    }
                    
                    isCreatingProject = false
                    showingSuccess = true
                }
            } catch {
                await MainActor.run {
                    errorMessage = "Failed to create project: \(error.localizedDescription)"
                    isCreatingProject = false
                    showingError = true
                }
            }
        }
    }
    
    func isVercelCompatibleTemplate(_ template: Template?) -> Bool {
        guard let template = template else { return false }
        
        // Check if it's a Next.js, Vite, or other Vercel-compatible template
        let vercelCompatibleTemplates = [
            "nextjs", "react", "vue", "vite", "gatsby", "nuxt",
            "ecommerce", "blog", "nextjs-google-auth", "fullstack"
        ]
        
        return vercelCompatibleTemplates.contains { template.name.lowercased().contains($0) }
    }
    
    func createEnvironmentFiles(at projectPath: String) async throws {
        // Create .env.local for Next.js projects
        let isNextJS = selectedTemplate?.name.lowercased().contains("next") ?? false
        let envFileName = isNextJS ? ".env.local" : ".env"
        
        // Create main env file
        var envContent = "# Environment Variables\n"
        envContent += "# Generated by Template Manager\n\n"
        
        for variable in environmentVariables {
            envContent += "\(variable.name)=\(variable.value)\n"
        }
        
        let envPath = (projectPath as NSString).appendingPathComponent(envFileName)
        try envContent.write(toFile: envPath, atomically: true, encoding: .utf8)
        
        // Create .env.example with masked values
        var exampleContent = "# Environment Variables Example\n"
        exampleContent += "# Copy this file to \(envFileName) and fill in your values\n\n"
        
        for variable in environmentVariables {
            if variable.isSecret {
                exampleContent += "\(variable.name)=your_\(variable.name.lowercased())_here\n"
            } else {
                exampleContent += "\(variable.name)=\(variable.value)\n"
            }
        }
        
        let examplePath = (projectPath as NSString).appendingPathComponent(".env.example")
        try exampleContent.write(toFile: examplePath, atomically: true, encoding: .utf8)
        
        // Update .gitignore to exclude env files
        let gitignorePath = (projectPath as NSString).appendingPathComponent(".gitignore")
        if FileManager.default.fileExists(atPath: gitignorePath) {
            var gitignoreContent = try String(contentsOfFile: gitignorePath)
            if !gitignoreContent.contains(envFileName) {
                gitignoreContent += "\n# Environment files\n\(envFileName)\n.env\n"
                try gitignoreContent.write(to: URL(fileURLWithPath: gitignorePath), atomically: true, encoding: .utf8)
            }
        } else {
            // Create .gitignore if it doesn't exist
            let gitignoreContent = """
            # Environment files
            \(envFileName)
            .env
            
            # Dependencies
            node_modules/
            
            # Build outputs
            .next/
            out/
            build/
            dist/
            
            # Misc
            .DS_Store
            *.log
            """
            try gitignoreContent.write(to: URL(fileURLWithPath: gitignorePath), atomically: true, encoding: .utf8)
        }
    }
}