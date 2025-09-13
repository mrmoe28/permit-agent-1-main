import SwiftUI

struct TemplatePreviewView: View {
    let template: Template
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Template Preview")
                .font(.headline)
            
            ScrollView {
                VStack(alignment: .leading, spacing: 5) {
                    Text("Directories:")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                    
                    ForEach(template.directories.prefix(5), id: \.self) { dir in
                        HStack {
                            Image(systemName: "folder")
                                .foregroundColor(.blue)
                            Text(dir)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    if template.directories.count > 5 {
                        Text("... and \(template.directories.count - 5) more")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    Text("Files:")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .padding(.top, 5)
                    
                    ForEach(template.files.prefix(5), id: \.self) { file in
                        HStack {
                            Image(systemName: "doc")
                                .foregroundColor(.gray)
                            Text(file)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    if template.files.count > 5 {
                        Text("... and \(template.files.count - 5) more")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(10)
            .background(Color.gray.opacity(0.1))
            .cornerRadius(8)
        }
    }
}