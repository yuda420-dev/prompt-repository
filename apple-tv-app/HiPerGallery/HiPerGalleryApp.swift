import SwiftUI

@main
struct HiPerGalleryApp: App {
    @StateObject private var artworkStore = ArtworkStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(artworkStore)
        }
    }
}

// MARK: - Configuration
struct Config {
    // Replace with your Supabase credentials
    static let supabaseURL = "YOUR_SUPABASE_URL"
    static let supabaseAnonKey = "YOUR_SUPABASE_ANON_KEY"

    // API endpoints
    static var artworksEndpoint: URL {
        URL(string: "\(supabaseURL)/rest/v1/artworks")!
    }
}
