import SwiftUI

struct TemplateGalleryView: View {
    @Binding var selectedTemplate: Template?
    @State private var selectedCategory: TemplateCategory? = nil
    @State private var searchText = ""
    @State private var hoveredTemplate: String? = nil
    let onDismiss: () -> Void
    
    @StateObject private var templateService = TemplateService()
    private let metadataService = TemplateMetadataService.shared
    
    private var enhancedTemplates: [EnhancedTemplate] {
        templateService.templates.compactMap { template in
            metadataService.enhanceTemplate(template)
        }
    }
    
    private var filteredTemplates: [EnhancedTemplate] {
        enhancedTemplates.filter { template in
            let matchesCategory = selectedCategory == nil || template.category == selectedCategory
            let matchesSearch = searchText.isEmpty || 
                template.displayName.localizedCaseInsensitiveContains(searchText) ||
                template.description.localizedCaseInsensitiveContains(searchText) ||
                template.technologies.contains { $0.localizedCaseInsensitiveContains(searchText) }
            return matchesCategory && matchesSearch
        }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            VStack(spacing: 16) {
                HStack {
                    Text("Template Gallery")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    
                    Spacer()
                    
                    Button("Close") {
                        onDismiss()
                    }
                    .keyboardShortcut(.escape)
                }
                
                // Search and Filter
                HStack(spacing: 12) {
                    // Search field
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(.secondary)
                        TextField("Search templates...", text: $searchText)
                            .textFieldStyle(PlainTextFieldStyle())
                    }
                    .padding(8)
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(8)
                    
                    // Category filter
                    Picker("Category", selection: $selectedCategory) {
                        Text("All Templates").tag(nil as TemplateCategory?)
                        ForEach(TemplateCategory.allCases, id: \.self) { category in
                            Text(category.displayName).tag(category as TemplateCategory?)
                        }
                    }
                    .pickerStyle(SegmentedPickerStyle())
                    .frame(width: 250)
                }
            }
            .padding(20)
            .background(Color(NSColor.windowBackgroundColor))
            
            Divider()
            
            // Template Grid
            ScrollView {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 350))], spacing: 20) {
                    ForEach(filteredTemplates) { enhancedTemplate in
                        TemplateCard(
                            enhancedTemplate: enhancedTemplate,
                            isSelected: selectedTemplate?.id == enhancedTemplate.template.id,
                            isHovered: hoveredTemplate == enhancedTemplate.id
                        )
                        .onTapGesture {
                            selectedTemplate = enhancedTemplate.template
                        }
                        .onHover { isHovered in
                            hoveredTemplate = isHovered ? enhancedTemplate.id : nil
                        }
                    }
                }
                .padding(20)
            }
            
            // Footer
            HStack {
                if let selected = selectedTemplate,
                   let enhanced = metadataService.enhanceTemplate(selected) {
                    Label("\(enhanced.displayName) selected", systemImage: "checkmark.circle.fill")
                        .foregroundColor(.green)
                }
                
                Spacer()
                
                Button("Cancel") {
                    onDismiss()
                }
                .keyboardShortcut(.escape)
                
                Button("Select Template") {
                    onDismiss()
                }
                .buttonStyle(.borderedProminent)
                .disabled(selectedTemplate == nil)
                .keyboardShortcut(.defaultAction)
            }
            .padding(20)
            .background(Color(NSColor.windowBackgroundColor))
        }
        .frame(width: 900, height: 700)
    }
}

struct TemplateCard: View {
    let enhancedTemplate: EnhancedTemplate
    let isSelected: Bool
    let isHovered: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                Image(systemName: enhancedTemplate.icon)
                    .font(.title2)
                    .foregroundColor(.blue)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(enhancedTemplate.displayName)
                        .font(.headline)
                    
                    Text(enhancedTemplate.category.displayName)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(enhancedTemplate.category == .blank ? Color.orange.opacity(0.2) : Color.blue.opacity(0.2))
                        .cornerRadius(4)
                }
                
                Spacer()
                
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                }
            }
            
            // Description
            Text(enhancedTemplate.description)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)
            
            Divider()
            
            // Features
            VStack(alignment: .leading, spacing: 6) {
                Text("Features:")
                    .font(.caption)
                    .fontWeight(.semibold)
                
                ForEach(enhancedTemplate.features.prefix(3), id: \.self) { feature in
                    HStack(spacing: 4) {
                        Image(systemName: "checkmark")
                            .font(.caption2)
                            .foregroundColor(.green)
                        Text(feature)
                            .font(.caption)
                            .lineLimit(1)
                    }
                }
                
                if enhancedTemplate.features.count > 3 {
                    Text("... and \(enhancedTemplate.features.count - 3) more")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            
            // Technologies
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 6) {
                    ForEach(enhancedTemplate.technologies, id: \.self) { tech in
                        Text(tech)
                            .font(.caption2)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.gray.opacity(0.2))
                            .cornerRadius(4)
                    }
                }
            }
            
            Spacer()
        }
        .padding(16)
        .frame(height: 280)
        .background(isSelected ? Color.blue.opacity(0.1) : Color.gray.opacity(0.05))
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(isSelected ? Color.blue : (isHovered ? Color.gray.opacity(0.3) : Color.clear), lineWidth: 2)
        )
        .cornerRadius(8)
        .shadow(radius: isHovered ? 4 : 2)
        .animation(.easeInOut(duration: 0.2), value: isHovered)
        .animation(.easeInOut(duration: 0.2), value: isSelected)
    }
}