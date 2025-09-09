import SwiftUI

struct SignInView: View {
    @State private var email = ""
    @State private var password = ""
    @State private var showingAlert = false
    @State private var alertMessage = ""
    
    let onSignInComplete: () -> Void
    let onBackToSignUp: () -> Void
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Text("Sign In")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                VStack(spacing: 16) {
                    TextField("Email", text: $email)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .textContentType(.emailAddress)
                    
                    SecureField("Password", text: $password)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                }
                
                Button("Sign In") {
                    // TODO: Implement sign in
                    onSignInComplete()
                }
                .buttonStyle(.borderedProminent)
                .disabled(email.isEmpty || password.isEmpty)
                
                Button("Don't have an account? Sign Up") {
                    onBackToSignUp()
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
                        onBackToSignUp()
                    }
                }
                #endif
            }
        }
    }
}
