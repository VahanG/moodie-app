#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(MoodieWidgetBridge, NSObject)

RCT_EXTERN_METHOD(setState:(NSString *)payload
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
