import SwiftUI
#if canImport(UIKit)
import UIKit
import WebKit
#endif

/// Renders an A2UI "Icon" component using inline SVG data.
public struct A2UIIconView: View {
    let component: A2UIComponent
    let tokenResolver: TokenResolver

    public var body: some View {
        let style = component.style
        let width = tokenResolver.resolveStyleCGFloat(style, key: "width") ?? 24
        let height = tokenResolver.resolveStyleCGFloat(style, key: "height") ?? 24

        iconContent(width: width, height: height)
    }

    @ViewBuilder
    private func iconContent(width: CGFloat, height: CGFloat) -> some View {
        #if canImport(UIKit)
        if let svgString = component["svgData"]?.stringValue {
            SVGWebView(svgString: svgString, size: CGSize(width: width, height: height))
                .frame(width: width, height: height)
        } else {
            placeholder(width: width, height: height)
        }
        #else
        placeholder(width: width, height: height)
        #endif
    }

    private func placeholder(width: CGFloat, height: CGFloat) -> some View {
        Image(systemName: "questionmark.square")
            .resizable()
            .aspectRatio(contentMode: .fit)
            .frame(width: width, height: height)
            .foregroundColor(.gray)
    }
}

#if canImport(UIKit)
/// Renders SVG content using a WKWebView with transparent background.
struct SVGWebView: UIViewRepresentable {
    let svgString: String
    let size: CGSize

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        let webView = WKWebView(frame: CGRect(origin: .zero, size: size), configuration: config)
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.bounces = false

        let html = """
        <!DOCTYPE html>
        <html>
        <head><meta name="viewport" content="width=\(Int(size.width)),initial-scale=1.0">
        <style>
        * { margin: 0; padding: 0; }
        html, body { width: \(Int(size.width))px; height: \(Int(size.height))px; background: transparent; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        svg { width: \(Int(size.width))px; height: \(Int(size.height))px; }
        </style>
        </head>
        <body>\(svgString)</body>
        </html>
        """
        webView.loadHTMLString(html, baseURL: nil)
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}
}
#endif
