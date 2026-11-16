import AuthenticationServices
import CryptoKit
import Foundation
import Security
import UIKit

/// Swift implementation behind the TurboModule (`RnAuthCore.mm` forwards here).
@objc(RnAuthCoreImpl)
public final class RnAuthCoreImpl: NSObject {
  public typealias Resolve = (String) -> Void
  public typealias Reject = (_ code: String, _ message: String) -> Void

  private var session: ASWebAuthenticationSession?
  private let anchorProvider = PresentationAnchorProvider()

  @objc public func randomBase64Url(_ byteLength: Int) -> String {
    var bytes = [UInt8](repeating: 0, count: min(max(byteLength, 1), 1024))
    let status = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
    precondition(status == errSecSuccess, "SecRandomCopyBytes failed")
    return Self.base64Url(Data(bytes))
  }

  @objc public func sha256Base64Url(_ input: String) -> String {
    Self.base64Url(Data(SHA256.hash(data: Data(input.utf8))))
  }

  @objc public func openAuthSession(
    _ url: String,
    redirectUri: String,
    prefersEphemeralSession: Bool,
    resolve: @escaping Resolve,
    reject: @escaping Reject
  ) {
    // The JS layer already restricts plain http to loopback hosts.
    guard let authURL = URL(string: url), ["https", "http"].contains(authURL.scheme ?? ""),
          let redirect = URLComponents(string: redirectUri),
          let scheme = redirect.scheme?.lowercased(), !scheme.isEmpty
    else {
      reject("INVALID_CONFIG", "The authorization URL must be http(s) and the redirect URI absolute")
      return
    }

    DispatchQueue.main.async {
      if self.session != nil {
        reject("INVALID_CONFIG", "Another sign-in is already in progress")
        return
      }

      let completion: ASWebAuthenticationSession.CompletionHandler = { callbackURL, error in
        // Clearing the session also breaks the session → handler → self cycle.
        self.session = nil
        if let callbackURL {
          resolve(callbackURL.absoluteString)
          return
        }
        let nsError = error as NSError?
        if nsError?.domain == ASWebAuthenticationSessionErrorDomain,
           nsError?.code == ASWebAuthenticationSessionError.canceledLogin.rawValue {
          reject("CANCELLED", "The user closed the browser")
        } else if nsError?.domain == ASWebAuthenticationSessionErrorDomain {
          reject("NOT_SUPPORTED", nsError?.localizedDescription ?? "The sign-in could not be presented")
        } else {
          reject("PROVIDER_ERROR", nsError?.localizedDescription ?? "The sign-in failed")
        }
      }

      let session: ASWebAuthenticationSession
      if scheme == "https" {
        // Universal Link redirect: only ASWebAuthenticationSession can
        // intercept it, starting with iOS 17.4.
        guard #available(iOS 17.4, *), let host = redirect.host else {
          reject("NOT_SUPPORTED", "https redirect URIs need iOS 17.4 or later; use a custom scheme")
          return
        }
        session = ASWebAuthenticationSession(
          url: authURL,
          callback: .https(host: host, path: redirect.path.isEmpty ? "/" : redirect.path),
          completionHandler: completion
        )
      } else {
        session = ASWebAuthenticationSession(
          url: authURL,
          callbackURLScheme: scheme,
          completionHandler: completion
        )
      }

      session.presentationContextProvider = self.anchorProvider
      session.prefersEphemeralWebBrowserSession = prefersEphemeralSession
      self.session = session
      if !session.start() {
        self.session = nil
        reject("NOT_SUPPORTED", "The sign-in could not be presented")
      }
    }
  }

  @objc public func cancelAuthSession() {
    DispatchQueue.main.async {
      // The completion handler runs with `canceledLogin` and rejects the promise.
      self.session?.cancel()
    }
  }

  private static func base64Url(_ data: Data) -> String {
    data.base64EncodedString()
      .replacingOccurrences(of: "+", with: "-")
      .replacingOccurrences(of: "/", with: "_")
      .replacingOccurrences(of: "=", with: "")
  }
}

// Kept out of the @objc class so the generated Swift header does not need
// AuthenticationServices.
private final class PresentationAnchorProvider: NSObject, ASWebAuthenticationPresentationContextProviding {
  func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    let active = scenes.first { $0.activationState == .foregroundActive } ?? scenes.first
    if let window = active?.windows.first(where: { $0.isKeyWindow }) ?? active?.windows.first {
      return window
    }
    if let active {
      return ASPresentationAnchor(windowScene: active)
    }
    return ASPresentationAnchor()
  }
}
