import SwiftUI

/// Renders an A2UI "Image" component as an AsyncImage.
public struct A2UIImageView: View {
    let component: A2UIComponent
    let tokenResolver: TokenResolver
    let dataResolver: DataBindingResolver

    public var body: some View {
        let urlString = dataResolver.resolve(component["url"]?.stringValue)
        let width = tokenResolver.resolveStyleCGFloat(component.style, key: "width")
        let height = tokenResolver.resolveStyleCGFloat(component.style, key: "height")

        if let url = URL(string: urlString) {
            AsyncImage(url: url) { phase in
                switch phase {
                case .success(let image):
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                case .failure:
                    Image(systemName: "photo")
                        .foregroundColor(.gray)
                case .empty:
                    ProgressView()
                @unknown default:
                    EmptyView()
                }
            }
            .if(width != nil || height != nil) { $0.frame(width: width, height: height) }
            .applyA2UIStyle(component.style, tokenResolver: tokenResolver)
        } else {
            Image(systemName: "photo")
                .foregroundColor(.gray)
                .if(width != nil || height != nil) { $0.frame(width: width, height: height) }
        }
    }
}
