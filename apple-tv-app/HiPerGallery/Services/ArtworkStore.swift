import Foundation
import Combine

@MainActor
class ArtworkStore: ObservableObject {
    @Published var artworks: [Artwork] = []
    @Published var series: [Series] = []
    @Published var favorites: Set<Int> = []
    @Published var isLoading = false
    @Published var error: String?
    @Published var selectedCategory: ArtCategory = .all

    private var cancellables = Set<AnyCancellable>()

    init() {
        loadFavorites()
        Task {
            await fetchArtworks()
        }
    }

    var filteredArtworks: [Artwork] {
        if selectedCategory == .all {
            return artworks
        }
        return artworks.filter { $0.category == selectedCategory.rawValue }
    }

    var favoriteArtworks: [Artwork] {
        artworks.filter { favorites.contains($0.id) }
    }

    func fetchArtworks() async {
        isLoading = true
        error = nil

        do {
            var request = URLRequest(url: Config.artworksEndpoint)
            request.setValue("Bearer \(Config.supabaseAnonKey)", forHTTPHeaderField: "Authorization")
            request.setValue(Config.supabaseAnonKey, forHTTPHeaderField: "apikey")
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")

            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                throw URLError(.badServerResponse)
            }

            let decoder = JSONDecoder()
            artworks = try decoder.decode([Artwork].self, from: data)
            groupIntoSeries()

        } catch {
            self.error = "Failed to load artworks: \(error.localizedDescription)"
            // Load sample data for demo
            loadSampleData()
        }

        isLoading = false
    }

    private func groupIntoSeries() {
        var seriesMap: [String: [Artwork]] = [:]

        for artwork in artworks {
            if let seriesName = artwork.seriesName, !seriesName.isEmpty {
                seriesMap[seriesName, default: []].append(artwork)
            }
        }

        series = seriesMap.map { Series(name: $0.key, artworks: $0.value) }
            .sorted { $0.name < $1.name }
    }

    // MARK: - Favorites

    func toggleFavorite(_ artworkId: Int) {
        if favorites.contains(artworkId) {
            favorites.remove(artworkId)
        } else {
            favorites.insert(artworkId)
        }
        saveFavorites()
    }

    func isFavorite(_ artworkId: Int) -> Bool {
        favorites.contains(artworkId)
    }

    private func loadFavorites() {
        if let data = UserDefaults.standard.data(forKey: "favorites"),
           let saved = try? JSONDecoder().decode(Set<Int>.self, from: data) {
            favorites = saved
        }
    }

    private func saveFavorites() {
        if let data = try? JSONEncoder().encode(favorites) {
            UserDefaults.standard.set(data, forKey: "favorites")
        }
    }

    // MARK: - Sample Data

    private func loadSampleData() {
        artworks = [
            Artwork(id: 1, title: "Cosmic Dreams", artist: "Artist", description: "An ethereal journey through celestial landscapes", category: "abstract", imageUrl: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800", seriesName: nil, style: "Digital Art", isDefault: true),
            Artwork(id: 2, title: "Urban Sunset", artist: "Artist", description: "City skyline bathed in golden hour light", category: "landscape", imageUrl: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800", seriesName: nil, style: "Photography", isDefault: true),
            Artwork(id: 3, title: "Nature's Pattern", artist: "Artist", description: "Intricate patterns found in nature", category: "nature", imageUrl: "https://images.unsplash.com/photo-1518173946687-a4c036bc9868?w=800", seriesName: nil, style: "Macro Photography", isDefault: true),
        ]
        groupIntoSeries()
    }
}
