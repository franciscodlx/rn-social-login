#import "RnAuthCore.h"

#if __has_include("RnAuthCore-Swift.h")
#import "RnAuthCore-Swift.h"
#else
#import <RnAuthCore/RnAuthCore-Swift.h>
#endif

@implementation RnAuthCore {
  RnAuthCoreImpl *_impl;
}

- (instancetype)init
{
  if (self = [super init]) {
    _impl = [RnAuthCoreImpl new];
  }
  return self;
}

- (NSNumber *)isAvailable
{
  return @YES;
}

- (NSString *)randomBase64Url:(double)byteLength
{
  return [_impl randomBase64Url:(NSInteger)byteLength];
}

- (NSString *)sha256Base64Url:(NSString *)input
{
  return [_impl sha256Base64Url:input];
}

- (void)openAuthSession:(NSString *)url
            redirectUri:(NSString *)redirectUri
prefersEphemeralSession:(BOOL)prefersEphemeralSession
                resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject
{
  [_impl openAuthSession:url
             redirectUri:redirectUri
 prefersEphemeralSession:prefersEphemeralSession
                 resolve:^(NSString *callbackUrl) {
                   resolve(callbackUrl);
                 }
                  reject:^(NSString *code, NSString *message) {
                    reject(code, message, nil);
                  }];
}

- (void)cancelAuthSession
{
  [_impl cancelAuthSession];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeRnAuthCoreSpecJSI>(params);
}

+ (NSString *)moduleName
{
  return @"RnAuthCore";
}

@end
