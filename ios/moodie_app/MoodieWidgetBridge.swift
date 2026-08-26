import Foundation
import React
import WidgetKit

@objc(MoodieWidgetBridge)
final class MoodieWidgetBridge: NSObject {
  private struct OpenedNotification: Codable {
    let affirmationId: String
    let affirmationText: String
  }

  private static let appGroup = "group.com.moodie.am.shared"
  private static let payloadKey = "affirmationWidgetPayloadV1"
  private static let openedNotificationKey = "openedNotificationAffirmationV1"

  @objc
  static func requiresMainQueueSetup() -> Bool {
    false
  }

  static func storeOpenedNotification(_ userInfo: [AnyHashable: Any]) {
    guard
      let affirmationId = userInfo["affirmationId"] as? String,
      !affirmationId.isEmpty,
      let affirmationText = userInfo["affirmationText"] as? String,
      !affirmationText.isEmpty,
      let payload = try? JSONEncoder().encode(
        OpenedNotification(
          affirmationId: affirmationId,
          affirmationText: affirmationText
        )
      )
    else {
      return
    }

    UserDefaults.standard.set(payload, forKey: openedNotificationKey)
  }

  @objc
  func setState(
    _ payload: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let defaults = UserDefaults(suiteName: Self.appGroup) else {
      reject("widget_state_error", "The Moodie widget App Group is unavailable.", nil)
      return
    }

    defaults.set(payload, forKey: Self.payloadKey)
    WidgetCenter.shared.reloadAllTimelines()
    resolve(nil)
  }

  @objc
  func consumeOpenedNotification(
    _ resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    let defaults = UserDefaults.standard
    let payload = defaults.data(forKey: Self.openedNotificationKey)
    defaults.removeObject(forKey: Self.openedNotificationKey)
    resolve(payload.flatMap { String(data: $0, encoding: .utf8) })
  }
}
