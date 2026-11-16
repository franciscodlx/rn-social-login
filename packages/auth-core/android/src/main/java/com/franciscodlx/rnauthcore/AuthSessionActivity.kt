package com.franciscodlx.rnauthcore

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.browser.customtabs.CustomTabsClient
import androidx.browser.customtabs.CustomTabsIntent

/**
 * Sits between the app and the browser tab while a sign-in is open.
 *
 * First resume: opens the authorization URL. When the user comes back it is
 * either because [AuthRedirectActivity] delivered the redirect (success) or
 * because they closed the tab (cancelled).
 */
class AuthSessionActivity : Activity() {
  private var browserOpened = false

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    browserOpened = savedInstanceState?.getBoolean(STATE_BROWSER_OPENED) ?: false
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
  }

  override fun onSaveInstanceState(outState: Bundle) {
    super.onSaveInstanceState(outState)
    outState.putBoolean(STATE_BROWSER_OPENED, browserOpened)
  }

  override fun onResume() {
    super.onResume()

    if (intent.getBooleanExtra(EXTRA_CANCEL, false)) {
      AuthSession.fail(AuthSession.CANCELLED, "The sign-in was cancelled")
      finish()
      return
    }

    if (!browserOpened) {
      browserOpened = true
      openBrowser()
      return
    }

    val redirect = intent.data
    if (redirect != null) {
      AuthSession.completeWithRedirect(redirect.toString())
    } else {
      AuthSession.fail(AuthSession.CANCELLED, "The user closed the browser")
    }
    finish()
  }

  private fun openBrowser() {
    val url = intent.getStringExtra(EXTRA_AUTH_URL)
    if (url == null || !AuthSession.isActive) {
      // Recreated without a sign-in to serve (e.g. after process death).
      AuthSession.fail(AuthSession.CANCELLED, "The sign-in was interrupted")
      finish()
      return
    }

    val uri = Uri.parse(url)
    val ephemeral = intent.getBooleanExtra(EXTRA_EPHEMERAL, false)
    val customTabsPackage = CustomTabsClient.getPackageName(this, null)

    try {
      if (customTabsPackage != null) {
        val builder = CustomTabsIntent.Builder().setShowTitle(true)
        if (ephemeral && CustomTabsClient.isEphemeralBrowsingSupported(this, customTabsPackage)) {
          builder.setEphemeralBrowsingEnabled(true)
        }
        val customTabs = builder.build()
        customTabs.intent.setPackage(customTabsPackage)
        customTabs.launchUrl(this, uri)
      } else {
        // No Custom Tabs provider: fall back to whatever browser handles https.
        startActivity(Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE))
      }
    } catch (e: ActivityNotFoundException) {
      AuthSession.fail(AuthSession.NOT_SUPPORTED, "No browser is available to sign in")
      finish()
    }
  }

  companion object {
    private const val EXTRA_AUTH_URL = "com.franciscodlx.rnauthcore.AUTH_URL"
    private const val EXTRA_EPHEMERAL = "com.franciscodlx.rnauthcore.EPHEMERAL"
    private const val EXTRA_CANCEL = "com.franciscodlx.rnauthcore.CANCEL"
    private const val STATE_BROWSER_OPENED = "browserOpened"

    fun startIntent(context: Context, url: String, ephemeral: Boolean): Intent =
      Intent(context, AuthSessionActivity::class.java)
        .putExtra(EXTRA_AUTH_URL, url)
        .putExtra(EXTRA_EPHEMERAL, ephemeral)

    /** Brings the activity back above the browser tab, delivering the redirect. */
    fun redirectIntent(context: Context, redirect: Uri?): Intent =
      Intent(context, AuthSessionActivity::class.java)
        .setData(redirect)
        .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)

    /** Brings the activity back above the browser tab to close it. */
    fun cancelIntent(context: Context): Intent =
      Intent(context, AuthSessionActivity::class.java)
        .putExtra(EXTRA_CANCEL, true)
        .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
  }
}
