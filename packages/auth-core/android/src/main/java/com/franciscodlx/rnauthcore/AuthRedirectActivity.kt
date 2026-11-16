package com.franciscodlx.rnauthcore

import android.app.Activity
import android.os.Bundle

/**
 * Entry point for the provider's redirect (custom scheme or App Link).
 * Hands the URL to [AuthSessionActivity], which also closes the browser tab.
 */
class AuthRedirectActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    // Any app can fire this intent: only forward it when it is the redirect
    // of a sign-in we started.
    if (AuthSession.matchesRedirect(intent.data)) {
      startActivity(AuthSessionActivity.redirectIntent(this, intent.data))
    }
    finish()
  }
}
