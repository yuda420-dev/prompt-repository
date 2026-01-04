import SwiftUI

struct ContentView: View {
    @EnvironmentObject var store: ArtworkStore
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            GalleryView()
                .tabItem {
                    Label("Gallery", systemImage: "photo.on.rectangle.angled")
                }
                .tag(0)

            SeriesListView()
                .tabItem {
                    Label("Series", systemImage: "rectangle.stack")
                }
                .tag(1)

            FavoritesView()
                .tabItem {
                    Label("Favorites", systemImage: "star.fill")
                }
                .tag(2)

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gear")
                }
                .tag(3)
        }
        .ignoresSafeArea()
    }
}

// MARK: - Gallery View
struct GalleryView: View {
    @EnvironmentObject var store: ArtworkStore
    @State private var selectedArtwork: Artwork?
    @FocusState private var focusedArtwork: Int?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 40) {
                    // Category filter
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 20) {
                            ForEach(ArtCategory.allCases, id: \.self) { category in
                                Button {
                                    store.selectedCategory = category
                                } label: {
                                    Text(category.displayName)
                                        .font(.headline)
                                        .padding(.horizontal, 30)
                                        .padding(.vertical, 15)
                                        .background(
                                            store.selectedCategory == category
                                                ? Color.orange
                                                : Color.white.opacity(0.1)
                                        )
                                        .foregroundColor(
                                            store.selectedCategory == category
                                                ? .black
                                                : .white
                                        )
                                        .cornerRadius(30)
                                }
                                .buttonStyle(.card)
                            }
                        }
                        .padding(.horizontal, 50)
                    }

                    // Artwork grid
                    LazyVGrid(columns: [
                        GridItem(.flexible(), spacing: 40),
                        GridItem(.flexible(), spacing: 40),
                        GridItem(.flexible(), spacing: 40),
                        GridItem(.flexible(), spacing: 40)
                    ], spacing: 50) {
                        ForEach(store.filteredArtworks) { artwork in
                            NavigationLink(value: artwork) {
                                ArtworkCard(artwork: artwork)
                            }
                            .buttonStyle(.card)
                            .focused($focusedArtwork, equals: artwork.id)
                        }
                    }
                    .padding(.horizontal, 50)
                }
                .padding(.vertical, 50)
            }
            .navigationTitle("HiPeR Gallery")
            .navigationDestination(for: Artwork.self) { artwork in
                ArtworkDetailView(artwork: artwork)
            }
        }
    }
}

// MARK: - Artwork Card
struct ArtworkCard: View {
    let artwork: Artwork
    @EnvironmentObject var store: ArtworkStore

    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            // Image
            AsyncImage(url: URL(string: artwork.imageUrl)) { phase in
                switch phase {
                case .empty:
                    Rectangle()
                        .fill(Color.gray.opacity(0.3))
                        .aspectRatio(4/5, contentMode: .fit)
                        .overlay {
                            ProgressView()
                        }
                case .success(let image):
                    image
                        .resizable()
                        .aspectRatio(4/5, contentMode: .fill)
                        .clipped()
                case .failure:
                    Rectangle()
                        .fill(Color.gray.opacity(0.3))
                        .aspectRatio(4/5, contentMode: .fit)
                        .overlay {
                            Image(systemName: "photo")
                                .font(.largeTitle)
                                .foregroundColor(.gray)
                        }
                @unknown default:
                    EmptyView()
                }
            }
            .cornerRadius(20)
            .overlay(alignment: .topTrailing) {
                if store.isFavorite(artwork.id) {
                    Image(systemName: "star.fill")
                        .foregroundColor(.orange)
                        .padding(15)
                        .background(.ultraThinMaterial)
                        .cornerRadius(10)
                        .padding(15)
                }
            }

            // Info
            VStack(alignment: .leading, spacing: 5) {
                Text(artwork.title)
                    .font(.headline)
                    .lineLimit(1)

                Text(artwork.category.capitalized)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal, 5)
        }
    }
}

// MARK: - Artwork Detail View
struct ArtworkDetailView: View {
    let artwork: Artwork
    @EnvironmentObject var store: ArtworkStore
    @Environment(\.dismiss) var dismiss

    var body: some View {
        GeometryReader { geometry in
            HStack(spacing: 60) {
                // Image
                AsyncImage(url: URL(string: artwork.imageUrl)) { phase in
                    switch phase {
                    case .empty:
                        Rectangle()
                            .fill(Color.gray.opacity(0.3))
                            .overlay { ProgressView() }
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                    case .failure:
                        Rectangle()
                            .fill(Color.gray.opacity(0.3))
                            .overlay {
                                Image(systemName: "photo")
                                    .font(.system(size: 60))
                                    .foregroundColor(.gray)
                            }
                    @unknown default:
                        EmptyView()
                    }
                }
                .cornerRadius(30)
                .frame(width: geometry.size.width * 0.5)

                // Details
                VStack(alignment: .leading, spacing: 30) {
                    VStack(alignment: .leading, spacing: 10) {
                        Text(artwork.title)
                            .font(.largeTitle)
                            .fontWeight(.bold)

                        if let style = artwork.style {
                            Text(style)
                                .font(.title2)
                                .foregroundColor(.secondary)
                        }

                        HStack {
                            Text(artwork.category.capitalized)
                                .font(.headline)
                                .padding(.horizontal, 20)
                                .padding(.vertical, 10)
                                .background(Color.orange.opacity(0.2))
                                .foregroundColor(.orange)
                                .cornerRadius(20)

                            if let series = artwork.seriesName {
                                Text(series)
                                    .font(.headline)
                                    .padding(.horizontal, 20)
                                    .padding(.vertical, 10)
                                    .background(Color.blue.opacity(0.2))
                                    .foregroundColor(.blue)
                                    .cornerRadius(20)
                            }
                        }
                    }

                    if let description = artwork.description {
                        Text(description)
                            .font(.body)
                            .foregroundColor(.secondary)
                            .lineLimit(6)
                    }

                    Spacer()

                    // Actions
                    HStack(spacing: 30) {
                        Button {
                            store.toggleFavorite(artwork.id)
                        } label: {
                            Label(
                                store.isFavorite(artwork.id) ? "Remove from Favorites" : "Add to Favorites",
                                systemImage: store.isFavorite(artwork.id) ? "star.fill" : "star"
                            )
                            .font(.headline)
                            .padding(.horizontal, 40)
                            .padding(.vertical, 20)
                            .background(store.isFavorite(artwork.id) ? Color.orange : Color.white.opacity(0.1))
                            .foregroundColor(store.isFavorite(artwork.id) ? .black : .white)
                            .cornerRadius(40)
                        }
                        .buttonStyle(.card)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.vertical, 50)
            }
            .padding(80)
        }
        .ignoresSafeArea()
        .background(Color.black)
    }
}

// MARK: - Series List View
struct SeriesListView: View {
    @EnvironmentObject var store: ArtworkStore

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVGrid(columns: [
                    GridItem(.flexible(), spacing: 40),
                    GridItem(.flexible(), spacing: 40),
                    GridItem(.flexible(), spacing: 40)
                ], spacing: 50) {
                    ForEach(store.series) { series in
                        NavigationLink(value: series) {
                            SeriesCard(series: series)
                        }
                        .buttonStyle(.card)
                    }
                }
                .padding(50)
            }
            .navigationTitle("Series")
            .navigationDestination(for: Series.self) { series in
                SeriesDetailView(series: series)
            }
        }
    }
}

struct SeriesCard: View {
    let series: Series

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            // Stack of images
            ZStack {
                ForEach(Array(series.artworks.prefix(3).enumerated().reversed()), id: \.offset) { index, artwork in
                    AsyncImage(url: URL(string: artwork.imageUrl)) { image in
                        image
                            .resizable()
                            .aspectRatio(4/5, contentMode: .fill)
                    } placeholder: {
                        Rectangle().fill(Color.gray.opacity(0.3))
                    }
                    .frame(height: 400)
                    .cornerRadius(20)
                    .offset(x: CGFloat(index) * -10, y: CGFloat(index) * -10)
                    .rotationEffect(.degrees(Double(index) * -3))
                }
            }

            // Info overlay
            VStack(alignment: .leading) {
                Text(series.name)
                    .font(.title2)
                    .fontWeight(.bold)

                Text("\(series.artworks.count) artworks")
                    .font(.subheadline)
                    .foregroundColor(.orange)
            }
            .padding(25)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(.ultraThinMaterial)
            .cornerRadius(20)
            .padding(15)
        }
    }
}

struct SeriesDetailView: View {
    let series: Series
    @State private var currentIndex = 0

    var body: some View {
        VStack {
            // Main image
            TabView(selection: $currentIndex) {
                ForEach(Array(series.artworks.enumerated()), id: \.element.id) { index, artwork in
                    AsyncImage(url: URL(string: artwork.imageUrl)) { image in
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                    } placeholder: {
                        ProgressView()
                    }
                    .tag(index)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .automatic))
            .frame(maxHeight: .infinity)

            // Thumbnail strip
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 20) {
                    ForEach(Array(series.artworks.enumerated()), id: \.element.id) { index, artwork in
                        Button {
                            currentIndex = index
                        } label: {
                            AsyncImage(url: URL(string: artwork.imageUrl)) { image in
                                image
                                    .resizable()
                                    .aspectRatio(1, contentMode: .fill)
                            } placeholder: {
                                Rectangle().fill(Color.gray.opacity(0.3))
                            }
                            .frame(width: 120, height: 120)
                            .cornerRadius(15)
                            .overlay {
                                if currentIndex == index {
                                    RoundedRectangle(cornerRadius: 15)
                                        .stroke(Color.orange, lineWidth: 4)
                                }
                            }
                        }
                        .buttonStyle(.card)
                    }
                }
                .padding(.horizontal, 50)
            }
            .frame(height: 160)
        }
        .navigationTitle(series.name)
    }
}

// MARK: - Favorites View
struct FavoritesView: View {
    @EnvironmentObject var store: ArtworkStore

    var body: some View {
        NavigationStack {
            Group {
                if store.favoriteArtworks.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "star")
                            .font(.system(size: 80))
                            .foregroundColor(.gray)

                        Text("No Favorites Yet")
                            .font(.title)

                        Text("Browse the gallery and add artworks to your favorites")
                            .foregroundColor(.secondary)
                    }
                } else {
                    ScrollView {
                        LazyVGrid(columns: [
                            GridItem(.flexible(), spacing: 40),
                            GridItem(.flexible(), spacing: 40),
                            GridItem(.flexible(), spacing: 40),
                            GridItem(.flexible(), spacing: 40)
                        ], spacing: 50) {
                            ForEach(store.favoriteArtworks) { artwork in
                                NavigationLink(value: artwork) {
                                    ArtworkCard(artwork: artwork)
                                }
                                .buttonStyle(.card)
                            }
                        }
                        .padding(50)
                    }
                }
            }
            .navigationTitle("Favorites")
            .navigationDestination(for: Artwork.self) { artwork in
                ArtworkDetailView(artwork: artwork)
            }
        }
    }
}

// MARK: - Settings View
struct SettingsView: View {
    var body: some View {
        NavigationStack {
            List {
                Section("About") {
                    LabeledContent("Version", value: "1.0.0")
                    LabeledContent("Build", value: "1")
                }

                Section("Account") {
                    Button("Sign In") {
                        // TODO: Implement sign in
                    }
                }

                Section("Display") {
                    Toggle("Auto-play Screensaver", isOn: .constant(true))
                    Picker("Screensaver Interval", selection: .constant(30)) {
                        Text("30 seconds").tag(30)
                        Text("1 minute").tag(60)
                        Text("2 minutes").tag(120)
                    }
                }
            }
            .navigationTitle("Settings")
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(ArtworkStore())
}
