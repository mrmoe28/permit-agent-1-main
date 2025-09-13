import SwiftUI

struct EnvironmentVariablesView: View {
    @Binding var environmentVariables: [EnvironmentVariable]
    @State private var showingAddVariable = false
    @State private var newVariableName = ""
    @State private var newVariableValue = ""
    @State private var editingVariable: EnvironmentVariable?
    
    let template: Template?
    
    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            HStack {
                Text("Environment Variables")
                    .font(.headline)
                
                Spacer()
                
                Button(action: { showingAddVariable.toggle() }) {
                    Label("Add Variable", systemImage: "plus.circle")
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.small)
            }
            
            if let template = template {
                Text("Configure environment variables for your \(template.name) project")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            Divider()
            
            if environmentVariables.isEmpty {
                VStack(spacing: 10) {
                    Image(systemName: "key.horizontal")
                        .font(.largeTitle)
                        .foregroundColor(.secondary)
                    
                    Text("No environment variables configured")
                        .foregroundColor(.secondary)
                    
                    Text("Add variables that your project needs, like API keys or configuration values")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 30)
            } else {
                ScrollView {
                    VStack(spacing: 10) {
                        ForEach(environmentVariables) { variable in
                            EnvironmentVariableRow(
                                variable: variable,
                                onEdit: { editingVariable = variable },
                                onDelete: { deleteVariable(variable) }
                            )
                        }
                    }
                }
                .frame(maxHeight: 300)
            }
            
            // Template-specific suggestions
            if let suggestedVariables = getSuggestedVariables() {
                Divider()
                
                VStack(alignment: .leading, spacing: 10) {
                    Text("Common variables for this template:")
                        .font(.caption)
                        .fontWeight(.medium)
                    
                    FlowLayout(spacing: 8) {
                        ForEach(suggestedVariables, id: \.name) { suggestion in
                            Button(action: {
                                addSuggestedVariable(suggestion)
                            }) {
                                Label(suggestion.name, systemImage: "plus")
                                    .font(.caption)
                            }
                            .buttonStyle(.bordered)
                            .controlSize(.small)
                            .disabled(environmentVariables.contains { $0.name == suggestion.name })
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color(NSColor.controlBackgroundColor))
        .cornerRadius(10)
        .sheet(isPresented: $showingAddVariable) {
            AddEnvironmentVariableView(
                variableName: $newVariableName,
                variableValue: $newVariableValue,
                onAdd: {
                    addVariable()
                    showingAddVariable = false
                },
                onCancel: {
                    newVariableName = ""
                    newVariableValue = ""
                    showingAddVariable = false
                }
            )
        }
        .sheet(item: $editingVariable) { variable in
            EditEnvironmentVariableView(
                variable: variable,
                onSave: { updatedVariable in
                    updateVariable(updatedVariable)
                    editingVariable = nil
                },
                onCancel: {
                    editingVariable = nil
                }
            )
        }
    }
    
    // MARK: - Helper Methods
    
    func addVariable() {
        let newVariable = EnvironmentVariable(
            id: UUID().uuidString,
            name: newVariableName.uppercased().replacingOccurrences(of: " ", with: "_"),
            value: newVariableValue,
            isSecret: newVariableValue.contains("secret") || newVariableValue.contains("key") || newVariableValue.contains("token")
        )
        environmentVariables.append(newVariable)
        newVariableName = ""
        newVariableValue = ""
    }
    
    func deleteVariable(_ variable: EnvironmentVariable) {
        environmentVariables.removeAll { $0.id == variable.id }
    }
    
    func updateVariable(_ variable: EnvironmentVariable) {
        if let index = environmentVariables.firstIndex(where: { $0.id == variable.id }) {
            environmentVariables[index] = variable
        }
    }
    
    func addSuggestedVariable(_ suggestion: SuggestedVariable) {
        let newVariable = EnvironmentVariable(
            id: UUID().uuidString,
            name: suggestion.name,
            value: suggestion.defaultValue,
            isSecret: suggestion.isSecret
        )
        environmentVariables.append(newVariable)
    }
    
    func getSuggestedVariables() -> [SuggestedVariable]? {
        guard let template = template else { return nil }
        
        switch template.name.lowercased() {
        case let name where name.contains("nextjs") && name.contains("auth"):
            return [
                SuggestedVariable(name: "NEXTAUTH_URL", defaultValue: "http://localhost:3000", isSecret: false),
                SuggestedVariable(name: "NEXTAUTH_SECRET", defaultValue: "", isSecret: true),
                SuggestedVariable(name: "GOOGLE_CLIENT_ID", defaultValue: "", isSecret: false),
                SuggestedVariable(name: "GOOGLE_CLIENT_SECRET", defaultValue: "", isSecret: true),
                SuggestedVariable(name: "DATABASE_URL", defaultValue: "postgresql://user:password@localhost:5432/mydb", isSecret: true)
            ]
        case let name where name.contains("ecommerce"):
            return [
                SuggestedVariable(name: "STRIPE_PUBLIC_KEY", defaultValue: "", isSecret: false),
                SuggestedVariable(name: "STRIPE_SECRET_KEY", defaultValue: "", isSecret: true),
                SuggestedVariable(name: "NEXT_PUBLIC_API_URL", defaultValue: "http://localhost:3000/api", isSecret: false)
            ]
        case let name where name.contains("blog"):
            return [
                SuggestedVariable(name: "NEXT_PUBLIC_SITE_URL", defaultValue: "http://localhost:3000", isSecret: false),
                SuggestedVariable(name: "ANALYTICS_ID", defaultValue: "", isSecret: false)
            ]
        case let name where name.contains("fullstack"):
            return [
                SuggestedVariable(name: "DATABASE_URL", defaultValue: "postgresql://user:password@localhost:5432/mydb", isSecret: true),
                SuggestedVariable(name: "JWT_SECRET", defaultValue: "", isSecret: true),
                SuggestedVariable(name: "PORT", defaultValue: "3001", isSecret: false)
            ]
        default:
            return nil
        }
    }
}

// MARK: - Supporting Types

struct EnvironmentVariable: Identifiable, Codable {
    let id: String
    var name: String
    var value: String
    var isSecret: Bool
}

struct SuggestedVariable {
    let name: String
    let defaultValue: String
    let isSecret: Bool
}

// MARK: - Environment Variable Row

struct EnvironmentVariableRow: View {
    let variable: EnvironmentVariable
    let onEdit: () -> Void
    let onDelete: () -> Void
    
    @State private var isHovering = false
    
    var body: some View {
        HStack {
            Image(systemName: variable.isSecret ? "key.fill" : "key")
                .foregroundColor(variable.isSecret ? .orange : .secondary)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(variable.name)
                    .fontWeight(.medium)
                
                Text(displayValue)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            if isHovering {
                HStack(spacing: 5) {
                    Button(action: onEdit) {
                        Image(systemName: "pencil")
                    }
                    .buttonStyle(.plain)
                    
                    Button(action: onDelete) {
                        Image(systemName: "trash")
                            .foregroundColor(.red)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color(NSColor.controlBackgroundColor))
        .cornerRadius(6)
        .onHover { hovering in
            withAnimation(.easeInOut(duration: 0.2)) {
                isHovering = hovering
            }
        }
    }
    
    var displayValue: String {
        if variable.isSecret && !variable.value.isEmpty {
            return String(repeating: "•", count: min(variable.value.count, 20))
        }
        return variable.value.isEmpty ? "(empty)" : variable.value
    }
}

// MARK: - Add/Edit Views

struct AddEnvironmentVariableView: View {
    @Binding var variableName: String
    @Binding var variableValue: String
    let onAdd: () -> Void
    let onCancel: () -> Void
    
    @State private var isSecret = false
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Add Environment Variable")
                .font(.headline)
            
            Form {
                TextField("Variable Name", text: $variableName)
                    .textFieldStyle(.roundedBorder)
                    .onChange(of: variableName) { newValue in
                        variableName = newValue.uppercased().replacingOccurrences(of: " ", with: "_")
                    }
                
                HStack {
                    if isSecret {
                        SecureField("Value", text: $variableValue)
                            .textFieldStyle(.roundedBorder)
                    } else {
                        TextField("Value", text: $variableValue)
                            .textFieldStyle(.roundedBorder)
                    }
                    
                    Toggle("Secret", isOn: $isSecret)
                        .toggleStyle(.checkbox)
                }
            }
            
            HStack {
                Button("Cancel", action: onCancel)
                    .keyboardShortcut(.escape)
                
                Spacer()
                
                Button("Add", action: onAdd)
                    .keyboardShortcut(.defaultAction)
                    .disabled(variableName.isEmpty)
            }
        }
        .padding()
        .frame(width: 400)
    }
}

struct EditEnvironmentVariableView: View {
    let variable: EnvironmentVariable
    let onSave: (EnvironmentVariable) -> Void
    let onCancel: () -> Void
    
    @State private var name: String
    @State private var value: String
    @State private var isSecret: Bool
    
    init(variable: EnvironmentVariable, onSave: @escaping (EnvironmentVariable) -> Void, onCancel: @escaping () -> Void) {
        self.variable = variable
        self.onSave = onSave
        self.onCancel = onCancel
        self._name = State(initialValue: variable.name)
        self._value = State(initialValue: variable.value)
        self._isSecret = State(initialValue: variable.isSecret)
    }
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Edit Environment Variable")
                .font(.headline)
            
            Form {
                TextField("Variable Name", text: $name)
                    .textFieldStyle(.roundedBorder)
                    .onChange(of: name) { newValue in
                        name = newValue.uppercased().replacingOccurrences(of: " ", with: "_")
                    }
                
                HStack {
                    if isSecret {
                        SecureField("Value", text: $value)
                            .textFieldStyle(.roundedBorder)
                    } else {
                        TextField("Value", text: $value)
                            .textFieldStyle(.roundedBorder)
                    }
                    
                    Toggle("Secret", isOn: $isSecret)
                        .toggleStyle(.checkbox)
                }
            }
            
            HStack {
                Button("Cancel", action: onCancel)
                    .keyboardShortcut(.escape)
                
                Spacer()
                
                Button("Save", action: {
                    var updatedVariable = variable
                    updatedVariable.name = name
                    updatedVariable.value = value
                    updatedVariable.isSecret = isSecret
                    onSave(updatedVariable)
                })
                .keyboardShortcut(.defaultAction)
                .disabled(name.isEmpty)
            }
        }
        .padding()
        .frame(width: 400)
    }
}

// MARK: - Flow Layout

struct FlowLayout: Layout {
    var spacing: CGFloat = 8
    
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = FlowResult(
            in: proposal.replacingUnspecifiedDimensions().width,
            subviews: subviews,
            spacing: spacing
        )
        return result.size
    }
    
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = FlowResult(
            in: bounds.width,
            subviews: subviews,
            spacing: spacing
        )
        
        for (index, frame) in result.frames.enumerated() {
            subviews[index].place(
                at: CGPoint(x: bounds.minX + frame.minX, y: bounds.minY + frame.minY),
                proposal: ProposedViewSize(frame.size)
            )
        }
    }
    
    struct FlowResult {
        var size: CGSize = .zero
        var frames: [CGRect] = []
        
        init(in maxWidth: CGFloat, subviews: Subviews, spacing: CGFloat) {
            var currentX: CGFloat = 0
            var currentY: CGFloat = 0
            var lineHeight: CGFloat = 0
            
            for subview in subviews {
                let size = subview.sizeThatFits(.unspecified)
                
                if currentX + size.width > maxWidth && currentX > 0 {
                    currentX = 0
                    currentY += lineHeight + spacing
                    lineHeight = 0
                }
                
                frames.append(CGRect(origin: CGPoint(x: currentX, y: currentY), size: size))
                
                currentX += size.width + spacing
                lineHeight = max(lineHeight, size.height)
                
                self.size.width = max(self.size.width, currentX - spacing)
            }
            
            self.size.height = currentY + lineHeight
        }
    }
}