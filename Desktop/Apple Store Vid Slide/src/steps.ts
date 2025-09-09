export interface SubmissionStep {
  title: string;
  slug: string;
  url?: string;
  selector?: string;
  notes?: string;
}

export const SubmissionSteps: SubmissionStep[] = [
  {
    title: "Login",
    slug: "login",
    url: "https://appstoreconnect.apple.com/login",
    notes: "Log in to App Store Connect (2FA if prompted). When the dashboard fully loads, press Enter to capture."
  },
  {
    title: "Apps Dashboard",
    slug: "apps-dashboard",
    url: "https://appstoreconnect.apple.com/apps",
    notes: "Confirm you're on Apps. Ensure the (+) New App is visible. Press Enter."
  },
  {
    title: "New App Modal",
    slug: "new-app-modal",
    notes: "Click (+) New App to open the modal. Do not submit—just show the fields (Name, Language, Bundle ID, SKU). Press Enter."
  },
  {
    title: "App Info — Main",
    slug: "app-info-main",
    notes: "Open an existing app/draft. Navigate to App Information (name, subtitle, category). Press Enter."
  },
  {
    title: "App Info — URLs & Age Rating",
    slug: "app-info-urls-age",
    notes: "Show Privacy Policy URL, Support URL, and the Age Rating questionnaire entry point. Press Enter."
  },
  {
    title: "App Privacy",
    slug: "app-privacy",
    notes: "Open App Privacy. Show Data Collection summary/questions. Press Enter."
  },
  {
    title: "Features — In-App Purchases",
    slug: "features-iap",
    notes: "Go to Features → In-App Purchases. Show the (+) add product button and list. Press Enter."
  },
  {
    title: "Prepare for Submission",
    slug: "prepare-for-submission",
    notes: "Open the version's Prepare for Submission page. Show 'What's New', Description, Keywords. Press Enter."
  },
  {
    title: "Encryption",
    slug: "encryption",
    notes: "Open the Export Compliance/Encryption section (where you declare HTTPS/standard encryption). Press Enter."
  },
  {
    title: "Upload via Xcode (Info Slide)",
    slug: "xcode-upload-info",
    notes: "Switch to an informational page/placeholder explaining Xcode → Archive → Upload. (If you have an internal wiki page, open it; otherwise show Activity tab.) Press Enter."
  },
  {
    title: "Activity — Build Processing",
    slug: "activity-build-processing",
    url: "https://appstoreconnect.apple.com/apps",
    notes: "Open your app → Activity. Show a build in processing / processed. Press Enter."
  },
  {
    title: "Select Build",
    slug: "select-build",
    notes: "Return to Prepare for Submission. Show the 'Select a build' action with the build list visible. Press Enter."
  },
  {
    title: "Attach IAP to Version",
    slug: "attach-iap",
    notes: "Show where to add IAPs to the submission (ensure products are Ready to Submit). Press Enter."
  },
  {
    title: "Review Notes (Demo Login)",
    slug: "review-notes",
    notes: "Open the Review Notes field. Type (or display) demo creds (mask sensitive data). Press Enter."
  },
  {
    title: "Submit for Review",
    slug: "submit-for-review",
    notes: "Scroll to the bottom where the Submit for Review button is visible. Do NOT click it. Press Enter."
  }
];