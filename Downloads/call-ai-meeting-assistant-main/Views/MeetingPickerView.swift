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
                            Text("Create Custom Meeting")
                        }
                    }
                } header: {
                    Text("Custom Meeting")
                }
            }
            .navigationTitle("Select Meeting")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
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
            Form {
                Section("Meeting Details") {
                    TextField("Meeting Title", text: $title)
                    
                    DatePicker("Start Time", selection: $date)
                    
                    HStack {
                        Text("Duration")
                        Spacer()
                        Text("\(Int(duration)) minutes")
                            .foregroundColor(.secondary)
                    }
                    
                    Slider(value: $duration, in: 15...240, step: 15) {
                        Text("Duration")
                    }
                }
            }
            .navigationTitle("New Meeting")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        let endDate = date.addingTimeInterval(duration * 60)
                        let meeting = Meeting(
                            title: title.isEmpty ? "Custom Meeting" : title,
                            startDate: date,
                            endDate: endDate
                        )
                        onSave(meeting)
                    }
                    .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
    }
}

#Preview {
    MeetingPickerView(selectedMeeting: .constant(nil))
}