import SwiftUI

struct SignUpView: View {
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var showingAlert = false
    @State private var alertMessage = ""
    
    let onSignUpComplete: () -> Void
    let onBackToSignIn: () -> Void
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Text("Sign Up")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                VStack(spacing: 16) {
                    TextField("Email", text: $email)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .textContentType(.emailAddress)
                    
                    SecureField("Password", text: $password)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                    
                    SecureField("Confirm Password", text: $confirmPassword)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                }
                
                Button("Sign Up") {
                    // TODO: Implement sign up
                    onSignUpComplete()
                }
                .buttonStyle(.borderedProminent)
                .disabled(email.isEmpty || password.isEmpty || confirmPassword.isEmpty)
                
                Button("Already have an account? Sign In") {
                    onBackToSignIn()
                }
                .foregroundColor(.blue)
            }
            .padding()
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                #if os(iOS)
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Back") {
                        onBackToSignIn()
                    }
                }
                #endif
            }
        }
    }
}