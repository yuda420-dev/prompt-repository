import Foundation

struct Artwork: Identifiable, Codable, Hashable {
    let id: Int
    let title: String
    let artist: String?
    let description: String?
    let category: String
    let imageUrl: String
    let seriesName: String?
    let style: String?
    let isDefault: Bool?

    enum CodingKeys: String, CodingKey {
        case id
        case title
        case artist
        case description
        case category
        case imageUrl = "image_url"
        case seriesName = "series_name"
        case style
        case isDefault = "is_default"
    }
}

struct Series: Identifiable, Hashable {
    let id: String
    let name: String
    var artworks: [Artwork]

    init(name: String, artworks: [Artwork]) {
        self.id = name
        self.name = name
        self.artworks = artworks
    }
}

// Category options matching web app
enum ArtCategory: String, CaseIterable {
    case all = "all"
    case abstract = "abstract"
    case surreal = "surreal"
    case nature = "nature"
    case portrait = "portrait"
    case landscape = "landscape"
    case geometric = "geometric"
    case minimal = "minimal"
    case digital = "digital"
    case mixedMedia = "mixed-media"

    var displayName: String {
        switch self {
        case .all: return "All"
        case .mixedMedia: return "Mixed Media"
        default: return rawValue.capitalized
        }
    }
}
