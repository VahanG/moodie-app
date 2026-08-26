package com.moodie_app

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import org.json.JSONArray
import org.json.JSONObject

class MoodieWidgetProvider : AppWidgetProvider() {
  internal data class WidgetAffirmation(val id: String, val text: String)

  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray,
  ) {
    val payload = loadPayload(context)
    appWidgetIds.forEach { widgetId ->
      appWidgetManager.updateAppWidget(widgetId, buildViews(context, payload))
    }
    scheduleRefreshes(context, payload)
  }

  override fun onReceive(context: Context, intent: Intent) {
    super.onReceive(context, intent)
    if (intent.action == REFRESH_ACTION) {
      updateAll(context)
      scheduleRefreshes(context, loadPayload(context))
    }
  }

  companion object {
    private const val PREFERENCES_NAME = "moodie_affirmation_widget"
    private const val PAYLOAD_KEY = "payload_v1"
    private const val REFRESH_ACTION = "com.moodie_app.widget.REFRESH"
    private const val THREE_HOURS_MS = 3L * 60L * 60L * 1000L
    private const val ONE_DAY_MS = 24L * 60L * 60L * 1000L

    fun savePayload(context: Context, payload: String) {
      context
        .getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
        .edit()
        .putString(PAYLOAD_KEY, payload)
        .apply()
    }

    private fun loadPayload(context: Context): String =
      context
        .getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
        .getString(PAYLOAD_KEY, null)
        .orEmpty()

    fun updateAll(context: Context) {
      val manager = AppWidgetManager.getInstance(context)
      val component = ComponentName(context, MoodieWidgetProvider::class.java)
      val payload = loadPayload(context)
      manager.getAppWidgetIds(component).forEach { widgetId ->
        manager.updateAppWidget(widgetId, buildViews(context, payload))
      }
    }

    private fun buildViews(context: Context, rawPayload: String): RemoteViews {
      val views = RemoteViews(context.packageName, R.layout.moodie_affirmation_widget)
      val affirmation = resolveAffirmation(rawPayload, System.currentTimeMillis())
      val text = affirmation?.text
        ?: context.getString(R.string.affirmation_widget_prompt)
      views.setTextViewText(R.id.moodie_widget_affirmation, text)

      val openAppIntent = Intent(context, MainActivity::class.java).apply {
        action = Intent.ACTION_VIEW
        data = buildAffirmationDeepLink(affirmation)
        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
      }
      val pendingIntent = PendingIntent.getActivity(
        context,
        0,
        openAppIntent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
      views.setOnClickPendingIntent(R.id.moodie_widget_root, pendingIntent)
      return views
    }

    private fun buildAffirmationDeepLink(affirmation: WidgetAffirmation?): Uri {
      val builder = Uri.Builder()
        .scheme("moodie-app")
        .authority("affirmations")
      if (affirmation != null) {
        builder
          .appendQueryParameter("affirmationId", affirmation.id)
          .appendQueryParameter("affirmationText", affirmation.text)
      }
      return builder.build()
    }

    internal fun resolveAffirmation(
      rawPayload: String,
      now: Long,
    ): WidgetAffirmation? {
      return try {
        val payload = JSONObject(rawPayload)
        if (payload.optInt("version") != 1) return null

        if (payload.optBoolean("notificationsEnabled")) {
          widgetAffirmation(latestNotification(payload, now))
            ?: rotatingAffirmation(payload.optJSONArray("affirmations"), now)
        } else {
          rotatingAffirmation(payload.optJSONArray("affirmations"), now)
        }
      } catch (_: Exception) {
        null
      }
    }

    private fun widgetAffirmation(value: JSONObject?): WidgetAffirmation? {
      if (value == null) return null
      val id = value.optString("id").trim()
      val text = value.optString("text").trim()
      return if (id.isEmpty() || text.isEmpty()) {
        null
      } else {
        WidgetAffirmation(id, text)
      }
    }

    private fun latestNotification(payload: JSONObject, now: Long): JSONObject? {
      val candidates = mutableListOf<JSONObject>()
      payload.optJSONObject("lastNotification")?.let(candidates::add)
      val scheduled = payload.optJSONArray("scheduledNotifications") ?: JSONArray()
      for (index in 0 until scheduled.length()) {
        scheduled.optJSONObject(index)?.let(candidates::add)
      }

      var latest: JSONObject? = null
      var latestDeliveryAt = -1L
      candidates.forEach { candidate ->
        var deliveryAt = candidate.optLong("deliveryAt", -1L)
        if (deliveryAt < 0L || deliveryAt > now) return@forEach
        if (candidate.optBoolean("repeatsDaily")) {
          deliveryAt += ((now - deliveryAt) / ONE_DAY_MS) * ONE_DAY_MS
        }
        if (deliveryAt > latestDeliveryAt) {
          latest = candidate
          latestDeliveryAt = deliveryAt
        }
      }
      return latest
    }

    private fun rotatingAffirmation(
      affirmations: JSONArray?,
      now: Long,
    ): WidgetAffirmation? {
      if (affirmations == null || affirmations.length() == 0) return null
      val index = ((now / THREE_HOURS_MS) % affirmations.length()).toInt()
      return widgetAffirmation(affirmations.optJSONObject(index))
    }

    fun scheduleRefreshes(context: Context, rawPayload: String) {
      val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      alarmManager.cancel(refreshPendingIntent(context, 0))

      val now = System.currentTimeMillis()
      val refreshTimes = mutableSetOf<Long>()
      refreshTimes.add(((now / THREE_HOURS_MS) + 1L) * THREE_HOURS_MS)

      try {
        val payload = JSONObject(rawPayload)
        val scheduled = payload.optJSONArray("scheduledNotifications") ?: JSONArray()
        for (index in 0 until scheduled.length()) {
          val notification = scheduled.optJSONObject(index) ?: continue
          var deliveryAt = notification.optLong("deliveryAt", -1L)
          if (deliveryAt < 0L) continue
          if (notification.optBoolean("repeatsDaily") && deliveryAt <= now) {
            deliveryAt += (((now - deliveryAt) / ONE_DAY_MS) + 1L) * ONE_DAY_MS
          }
          if (deliveryAt > now) refreshTimes.add(deliveryAt)
        }
      } catch (_: Exception) {
        // The periodic rotation refresh still keeps an unavailable widget recoverable.
      }

      refreshTimes.minOrNull()?.let { time ->
        alarmManager.setAndAllowWhileIdle(
          AlarmManager.RTC_WAKEUP,
          time,
          refreshPendingIntent(context, 0),
        )
      }
    }

    private fun refreshPendingIntent(context: Context, requestCode: Int): PendingIntent {
      val intent = Intent(context, MoodieWidgetProvider::class.java).apply {
        action = REFRESH_ACTION
      }
      return PendingIntent.getBroadcast(
        context,
        requestCode,
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
    }
  }
}
