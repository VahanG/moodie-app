package com.moodie_app

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class MoodieWidgetModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "MoodieWidgetBridge"

  @ReactMethod
  fun setState(payload: String, promise: Promise) {
    try {
      MoodieWidgetProvider.savePayload(reactContext, payload)
      MoodieWidgetProvider.updateAll(reactContext)
      MoodieWidgetProvider.scheduleRefreshes(reactContext, payload)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("widget_state_error", error.message, error)
    }
  }
}
