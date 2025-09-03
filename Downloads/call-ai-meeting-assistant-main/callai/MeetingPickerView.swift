import SwiftUI

struct MeetingPickerView: View {
    @Binding var selectedMeeting: Meeting?
    @StateObject private var calendarService = CalendarService()
    @Environment(\.dismiss) private var dismiss
    @State private var customMeetingTitle = ""
    @State private var customMeetingDate = Date()
    @State private var customMeetingDuration = 60.0
    @State private var showingCustomMeeting = false
    
    var body: some View {
        NavigationView {
            List {
                if !calendarService.meetings.isEmpty {
                    Section("Upcoming Meetings") {
                        ForEach(calendarService.meetings, id: \.id) { meeting in
                            Button {
                                selectedMeeting = meeting
                                dismiss()
                            } label: {
                                MeetingRowView(meeting: meeting)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                
                Section {
                    Button {
                        showingCustomMeeting = true
                    } label: {
                        HStack {
                            Image(systemName: "plus.circle.fill")
                                .foregroundColor(.blue)
                                .font(.title2)
                            VStack(alignment: .leading) {
                                Text("Create Custom Meeting")
                                    .foregroundColor(.primary)
                                    .fontWeight(.medium)
                                Text("Set your own meeting details")
                                    .foregroundColor(.secondary)
                                    .font(.caption)
                            }
                            Spacer()
                        }
                        .padding(.vertical, 4)
                    }
                } header: {
                    Text("Custom Meeting")
                }
            }
            .listStyle(.sidebar)
            .background(Color(uiColor: .systemBackground))
            .scrollContentBackground(.hidden)
            .navigationTitle("Select Meeting")
            
            .toolbar {
                ToolbarItem(placement: .navigation) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
            .onAppear {
                if calendarService.authorizationStatus == .fullAccess {
                    Task {
                        await calendarService.loadUpcomingMeetings()
                    }
                }
            }
            .sheet(isPresented: $showingCustomMeeting) {
                CustomMeetingView(
                    title: $customMeetingTitle,
                    date: $customMeetingDate,
                    duration: $customMeetingDuration
                ) { meeting in
                    selectedMeeting = meeting
                    dismiss()
                }
            }
        }
    }
}

struct CustomMeetingView: View {
    @Binding var title: String
    @Binding var date: Date
    @Binding var duration: Double
    let onSave: (Meeting) -> Void
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Header
                HStack {
                    Text("New Meeting")
                        .font(.title2)
                        .fontWeight(.bold)
                    Spacer()
                }
                .padding()
                .background(Color(.secondarySystemBackground))
                
                // Form content with larger container
                ScrollView {
                    VStack(spacing: 24) {
                        VStack(alignment: .leading, spacing: 16) {
                            Text("Meeting Details")
                                .font(.headline)
                                .foregroundColor(.primary)
                            
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Title")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                TextField("Enter meeting title", text: $title)
                                    .textFieldStyle(.roundedBorder)
                                    .font(.body)
                            }
                            
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Start Time")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                DatePicker("Start Time", selection: $date)
                                    .datePickerStyle(.compact)
                                    .labelsHidden()
                            }
                            
                            VStack(alignment: .leading, spacing: 12) {
                                HStack {
                                    Text("Duration")
                                        .font(.subheadline)
                                        .fontWeight(.medium)
                                    Spacer()
                                    Text("\(Int(duration)) minutes")
                                        .foregroundColor(.blue)
                                        .fontWeight(.medium)
                                        .font(.body)
                                }
                                
                                Slider(value: $duration, in: 15...240, step: 15) {
                                    Text("Duration")
                                }
                                .tint(.blue)
                                
                                // Duration presets
                                HStack(spacing: 8) {
                                    ForEach([30, 60, 90, 120], id: \.self) { preset in
                                        Button("\(preset)m") {
                                            duration = Double(preset)
                                        }
                                        .buttonStyle(.bordered)
                                        .controlSize(.small)
                                        .foregroundColor(duration == Double(preset) ? .white : .blue)
                                        .background(duration == Double(preset) ? .blue : .clear)
                                        .clipShape(RoundedRectangle(cornerRadius: 6))
                                    }
                                    Spacer()
                                }
                            }
                        }
                        .padding()
                        .background(Color(uiColor: .secondarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        
                        // Action buttons
                        HStack(spacing: 12) {
                            Button("Cancel") {
                                dismiss()
                            }
                            .buttonStyle(.bordered)
                            .controlSize(.large)
                            
                            Spacer()
                            
                            Button("Create Meeting") {
                                let endDate = date.addingTimeInterval(duration * 60)
                                let meeting = Meeting(
                                    title: title.isEmpty ? "Custom Meeting" : title,
                                    startDate: date,
                                    endDate: endDate,
                                    participants: []
                                )
                                onSave(meeting)
                                dismiss()
                            }
                            .buttonStyle(.borderedProminent)
                            .controlSize(.large)
                            .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                        }
                        .padding(.top, 20)
                        
                        Spacer()
                    }
                    .padding()
                }
                .background(Color(uiColor: .systemBackground))
            }
            .frame(width: 600, height: 500)
            .presentationDetents([.height(500)])
            .presentationDragIndicator(.hidden)
            
            .toolbar {
                ToolbarItem(placement: .navigation) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .primaryAction) {
                    Button("Save") {
                        let endDate = date.addingTimeInterval(duration * 60)
                        let meeting = Meeting(
                            title: title.isEmpty ? "Custom Meeting" : title,
                            startDate: date,
                            endDate: endDate,
                            participants: []
                        )
                        onSave(meeting)
                    }
                    .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    .buttonStyle(.borderedProminent)
                }
            }
        }
    }
}

#Preview {
    MeetingPickerView(selectedMeeting: .constant(nil))
}