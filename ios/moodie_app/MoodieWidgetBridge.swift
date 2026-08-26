import Foundation
import React
import WidgetKit

@objc(MoodieWidgetBridge)
final class MoodieWidgetBridge: NSObject {
  private static let appGroup = "group.com.moodie.am.shared"
  private static let payloadKey = "affirmationWidgetPayloadV1"

  @objc
  static func requiresMainQueueSetup() -> Bool {
    false
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
}
