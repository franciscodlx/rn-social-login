package com.franciscodlx.rnauthcore

import android.content.Intent
import android.net.Uri
import android.util.Base64
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import java.security.MessageDigest
import java.security.SecureRandom

class RnAuthCoreModule(reactContext: ReactApplicationContext) :
  NativeRnAuthCoreSpec(reactContext) {

  private val secureRandom = SecureRandom()

  override fun isAvailable(): Boolean {
    val probe = Intent(Intent.ACTION_VIEW, Uri.parse("https://example.com"))
      .addCategory(Intent.CATEGORY_BROWSABLE)
    return probe.resolveActivity(reactApplicationContext.packageManager) != null
  }

  override fun randomBase64Url(byteLength: Double): String {
    val bytes = ByteArray(byteLength.toInt().coerceIn(1, 1024))
    secureRandom.nextBytes(bytes)
    return base64Url(bytes)
  }

  override fun sha256Base64Url(input: String): String =
    base64Url(MessageDigest.getInstance("SHA-256").digest(input.toByteArray(Charsets.UTF_8)))

  override fun openAuthSession(
    url: String,
    redirectUri: String,
    prefersEphemeralSession: Boolean,
    promise: Promise
  ) {
    val authUri = Uri.parse(url)
    val redirect = Uri.parse(redirectUri)
    // The JS layer already restricts plain http to loopback hosts.
    if (authUri.scheme !in listOf("https", "http") || redirect.scheme.isNullOrEmpty()) {
      promise.reject(AuthSession.INVALID_CONFIG, "The authorization URL must be http(s) and the redirect URI absolute")
      return
    }

    val started = AuthSession.begin(redirect, object : AuthSession.Listener {
      override fun onRedirect(url: String) = promise.resolve(url)
      override fun onError(code: String, message: String) = promise.reject(code, message)
    })
    if (!started) {
      promise.reject(AuthSession.INVALID_CONFIG, "Another sign-in is already in progress")
      return
    }

    try {
      val context = reactApplicationContext
      val intent = AuthSessionActivity.startIntent(context, url, prefersEphemeralSession)
      val activity = context.currentActivity
      if (activity != null) {
        activity.startActivity(intent)
      } else {
        context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      }
    } catch (e: Exception) {
      AuthSession.fail(AuthSession.NOT_SUPPORTED, e.message ?: "Could not start the sign-in")
    }
  }

  override fun cancelAuthSession() {
    if (!AuthSession.isActive) {
      return
    }
    val context = reactApplicationContext
    val intent = AuthSessionActivity.cancelIntent(context)
    val activity = context.currentActivity
    if (activity != null) {
      activity.startActivity(intent)
    } else {
      context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
  }

  private fun base64Url(bytes: ByteArray): String =
    Base64.encodeToString(bytes, Base64.URL_SAFE or Base64.NO_PADDING or Base64.NO_WRAP)

  companion object {
    const val NAME = NativeRnAuthCoreSpec.NAME
  }
}
