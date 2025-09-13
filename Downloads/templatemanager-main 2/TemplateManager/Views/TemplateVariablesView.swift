import SwiftUI

struct TemplateVariablesView: View {
    let template: Template
    @Binding var variableValues: [TemplateVariableValue]
    @State private var isValid = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("Template Configuration")
                .font(.headline)
            
            Text("This template requires some configuration. Please fill in the values below:")
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            Divider()
            
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    ForEach($variableValues) { $variableValue in
                        VariableInputView(variableValue: $variableValue)
                    }
                }
                .padding(.vertical, 10)
            }
            
            Divider()
            
            HStack {
                Text(validationMessage)
                    .font(.caption)
                    .foregroundColor(isValid ? .green : .orange)
                
                Spacer()
            }
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(Color(NSColor.controlBackgroundColor))
        .cornerRadius(10)
        .onAppear {
            validateVariables()
        }
        .onChange(of: variableValues) { _ in
            validateVariables()
        }
    }
    
    var validationMessage: String {
        let requiredCount = variableValues.filter { $0.variable.required && $0.value.isEmpty }.count
        if requiredCount > 0 {
            return "\(requiredCount) required field\(requiredCount > 1 ? "s" : "") remaining"
        } else {
            return "All required fields completed"
        }
    }
    
    func validateVariables() {
        isValid = variableValues.allSatisfy { variableValue in
            !variableValue.variable.required || !variableValue.value.isEmpty
        }
    }
}

struct VariableInputView: View {
    @Binding var variableValue: TemplateVariableValue
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(variableValue.variable.name)
                    .fontWeight(.medium)
                
                if variableValue.variable.required {
                    Text("*")
                        .foregroundColor(.red)
                }
            }
            
            if !variableValue.variable.description.isEmpty {
                Text(variableValue.variable.description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            switch variableValue.variable.type {
            case .string:
                TextField(
                    variableValue.variable.placeholder ?? variableValue.variable.name,
                    text: $variableValue.value
                )
                .textFieldStyle(.roundedBorder)
                
            case .boolean:
                Toggle(isOn: Binding(
                    get: { variableValue.value == "true" },
                    set: { variableValue.value = $0 ? "true" : "false" }
                )) {
                    Text("Enable")
                }
                
            case .choice:
                if let options = variableValue.variable.options {
                    Picker("", selection: $variableValue.value) {
                        if !variableValue.variable.required {
                            Text("None").tag("")
                        }
                        ForEach(options, id: \.self) { option in
                            Text(option).tag(option)
                        }
                    }
                    .pickerStyle(.menu)
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                
            case .number:
                TextField(
                    variableValue.variable.placeholder ?? "0",
                    text: $variableValue.value
                )
                .textFieldStyle(.roundedBorder)
                .onChange(of: variableValue.value) { newValue in
                    // Ensure only numbers are entered
                    let filtered = newValue.filter { $0.isNumber || $0 == "." }
                    if filtered != newValue {
                        variableValue.value = filtered
                    }
                }
            }
        }
    }
}

// Helper to create a dictionary of variable replacements
extension Array where Element == TemplateVariableValue {
    func toReplacementDictionary() -> [String: String] {
        var dict: [String: String] = [:]
        for variableValue in self {
            // Use {{VARIABLE_ID}} format for replacements
            dict["{{\(variableValue.variable.id)}}"] = variableValue.value
        }
        return dict
    }
}