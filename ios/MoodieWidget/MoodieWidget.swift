import SwiftUI
import WidgetKit

private let appGroup = "group.com.moodie.am.shared"
private let payloadKey = "affirmationWidgetPayloadV1"
private let threeHours: TimeInterval = 3 * 60 * 60
private let oneDay: TimeInterval = 24 * 60 * 60

private struct WidgetAffirmation: Codable {
  let id: String
  let text: String
}

private struct ScheduledWidgetAffirmation: Codable {
  let id: String
  let text: String
  let deliveryAt: TimeInterval
  let repeatsDaily: Bool?
}

private struct AffirmationWidgetPayload: Codable {
  let version: Int
  let notificationsEnabled: Bool
  let affirmations: [WidgetAffirmation]
  let scheduledNotifications: [ScheduledWidgetAffirmation]
  let lastNotification: ScheduledWidgetAffirmation?
  let updatedAt: TimeInterval
}

private struct MoodieWidgetEntry: TimelineEntry {
  let date: Date
  let affirmation: WidgetAffirmation?

  var deepLinkURL: URL? {
    guard let affirmation else {
      return URL(string: "moodie-app://affirmations")
    }

    var components = URLComponents()
    components.scheme = "moodie-app"
    components.host = "affirmations"
    components.queryItems = [
      URLQueryItem(name: "affirmationId", value: affirmation.id),
      URLQueryItem(name: "affirmationText", value: affirmation.text),
    ]
    return components.url
  }
}

private enum WidgetState {
  static func load() -> AffirmationWidgetPayload? {
    guard
      let rawPayload = UserDefaults(suiteName: appGroup)?.string(forKey: payloadKey),
      let data = rawPayload.data(using: .utf8),
      let payload = try? JSONDecoder().decode(AffirmationWidgetPayload.self, from: data),
      payload.version == 1
    else {
      return nil
    }

    return payload
  }

  static func affirmation(
    from payload: AffirmationWidgetPayload?,
    at date: Date
  ) -> WidgetAffirmation? {
    guard let payload else { return nil }

    if payload.notificationsEnabled,
       let latest = latestNotification(in: payload, at: date) {
      let text = latest.text.trimmingCharacters(in: .whitespacesAndNewlines)
      if !text.isEmpty { return WidgetAffirmation(id: latest.id, text: text) }
    }

    guard !payload.affirmations.isEmpty else { return nil }
    let bucket = Int(floor(date.timeIntervalSince1970 / threeHours))
    let index = bucket % payload.affirmations.count
    let text = payload.affirmations[index].text
      .trimmingCharacters(in: .whitespacesAndNewlines)
    return text.isEmpty
      ? nil
      : WidgetAffirmation(id: payload.affirmations[index].id, text: text)
  }

  static func nextRefresh(
    for payload: AffirmationWidgetPayload?,
    after date: Date
  ) -> Date {
    let nextBucket = Date(
      timeIntervalSince1970:
        (floor(date.timeIntervalSince1970 / threeHours) + 1) * threeHours
    )
    guard let payload else { return nextBucket }

    let futureDeliveries = payload.scheduledNotifications.compactMap { notification -> Date? in
      var delivery = Date(timeIntervalSince1970: notification.deliveryAt / 1000)
      if notification.repeatsDaily == true {
        if delivery <= date {
          let elapsedDays = floor(date.timeIntervalSince(delivery) / oneDay) + 1
          delivery = delivery.addingTimeInterval(elapsedDays * oneDay)
        }
      }
      return delivery > date ? delivery : nil
    }

    return futureDeliveries.min().map { min($0, nextBucket) } ?? nextBucket
  }

  private static func latestNotification(
    in payload: AffirmationWidgetPayload,
    at date: Date
  ) -> ScheduledWidgetAffirmation? {
    var latest: (notification: ScheduledWidgetAffirmation, date: Date)?
    let notifications = [payload.lastNotification].compactMap { $0 }
      + payload.scheduledNotifications

    notifications.forEach { notification in
      var delivery = Date(timeIntervalSince1970: notification.deliveryAt / 1000)
      guard delivery <= date else { return }
      if notification.repeatsDaily == true {
        let elapsedDays = floor(date.timeIntervalSince(delivery) / oneDay)
        delivery = delivery.addingTimeInterval(elapsedDays * oneDay)
      }
      if latest == nil || delivery > latest!.date {
        latest = (notification, delivery)
      }
    }

    return latest?.notification
  }
}

private struct MoodieWidgetProvider: TimelineProvider {
  func placeholder(in context: Context) -> MoodieWidgetEntry {
    MoodieWidgetEntry(date: Date(), affirmation: nil)
  }

  func getSnapshot(
    in context: Context,
    completion: @escaping (MoodieWidgetEntry) -> Void
  ) {
    let date = Date()
    completion(
      MoodieWidgetEntry(
        date: date,
        affirmation: WidgetState.affirmation(from: WidgetState.load(), at: date)
      )
    )
  }

  func getTimeline(
    in context: Context,
    completion: @escaping (Timeline<MoodieWidgetEntry>) -> Void
  ) {
    let date = Date()
    let payload = WidgetState.load()
    let entry = MoodieWidgetEntry(
      date: date,
      affirmation: WidgetState.affirmation(from: payload, at: date)
    )
    completion(
      Timeline(
        entries: [entry],
        policy: .after(WidgetState.nextRefresh(for: payload, after: date))
      )
    )
  }
}

private struct MoodieWidgetView: View {
  let entry: MoodieWidgetEntry
  @Environment(\.widgetFamily) private var family

  private var affirmation: String {
    entry.affirmation?.text
      ?? "Open Moodie to refresh your selected affirmations."
  }

  private var homeScreenContent: some View {
    VStack(spacing: 10) {
      Text("MOODIE")
        .font(.system(size: 11, weight: .semibold))
        .tracking(2)
        .foregroundStyle(Color.white.opacity(0.82))
      Text(affirmation)
        .font(.system(size: 18, weight: .semibold, design: .rounded))
        .multilineTextAlignment(.center)
        .foregroundStyle(.white)
        .minimumScaleFactor(0.72)
    }
    .padding(18)
  }

  private var inlineContent: some View {
    Label {
      Text(affirmation)
        .lineLimit(1)
    } icon: {
      Image(systemName: "sparkles")
    }
    .widgetAccentable()
  }

  private var rectangularContent: some View {
    ZStack {
      AccessoryWidgetBackground()

      VStack(alignment: .leading, spacing: 3) {
        Label("MOODIE", systemImage: "sparkles")
          .font(.system(size: 10, weight: .semibold))
          .widgetAccentable()

        Text(affirmation)
          .font(.system(size: 13, weight: .semibold, design: .rounded))
          .lineLimit(2)
          .minimumScaleFactor(0.8)
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
      .padding(.horizontal, 8)
      .padding(.vertical, 6)
    }
  }

  @ViewBuilder
  private var homeScreenBody: some View {
    if #available(iOSApplicationExtension 17.0, *) {
      homeScreenContent.containerBackground(for: .widget) {
        LinearGradient(
          colors: [Color(red: 0.14, green: 0.23, blue: 0.47),
                   Color(red: 0.42, green: 0.29, blue: 0.63)],
          startPoint: .topLeading,
          endPoint: .bottomTrailing
        )
      }
    } else {
      homeScreenContent.background(
        LinearGradient(
          colors: [Color(red: 0.14, green: 0.23, blue: 0.47),
                   Color(red: 0.42, green: 0.29, blue: 0.63)],
          startPoint: .topLeading,
          endPoint: .bottomTrailing
        )
      )
    }
  }

  @ViewBuilder
  var body: some View {
    switch family {
    case .accessoryInline:
      inlineContent
    case .accessoryRectangular:
      rectangularContent
    default:
      homeScreenBody
    }
  }
}

@main
struct MoodieAffirmationWidget: Widget {
  let kind = "MoodieAffirmationWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: MoodieWidgetProvider()) { entry in
      MoodieWidgetView(entry: entry)
        .widgetURL(entry.deepLinkURL)
    }
    .configurationDisplayName("Moodie Affirmation")
    .description("Keep a topic-aware affirmation on your Home Screen or Lock Screen.")
    .supportedFamilies([
      .systemSmall,
      .systemMedium,
      .accessoryInline,
      .accessoryRectangular,
    ])
  }
}
