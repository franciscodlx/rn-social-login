package com.franciscodlx.rnauthcore

import android.net.Uri

/**
 * The single sign-in in progress. Activities report the outcome here and the
 * module turns it into the JS promise result.
 */
internal object AuthSession {
  interface Listener {
    fun onRedirect(url: String)
    fun onError(code: String, message: String)
  }

  const val CANCELLED = "CANCELLED"
  const val NOT_SUPPORTED = "NOT_SUPPORTED"
  const val INVALID_CONFIG = "INVALID_CONFIG"

  private var listener: Listener? = null
  private var redirectUri: Uri? = null

  @Synchronized
  fun begin(redirectUri: Uri, listener: Listener): Boolean {
    if (this.listener != null) {
      return false
    }
    this.listener = listener
    this.redirectUri = redirectUri
    return true
  }

  val isActive: Boolean
    @Synchronized get() = listener != null

  /** Whether [uri] is the redirect of the sign-in in progress. */
  @Synchronized
  fun matchesRedirect(uri: Uri?): Boolean {
    val expected = redirectUri ?: return false
    if (uri == null) {
      return false
    }
    return expected.scheme.equals(uri.scheme, ignoreCase = true) &&
      (expected.host ?: "").equals(uri.host ?: "", ignoreCase = true) &&
      expected.port == uri.port &&
      (expected.path ?: "").trimEnd('/') == (uri.path ?: "").trimEnd('/')
  }

  fun completeWithRedirect(url: String) {
    take()?.onRedirect(url)
  }

  fun fail(code: String, message: String) {
    take()?.onError(code, message)
  }

  @Synchronized
  private fun take(): Listener? {
    val current = listener
    listener = null
    redirectUri = null
    return current
  }
}
