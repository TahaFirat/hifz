import UIKit
import Capacitor
import WebKit
import CoreSpotlight

class HifzRootBridgeViewController: CAPBridgeViewController {
    override public func capacitorDidLoad() {
        super.capacitorDidLoad()
        HifzNativeEngine.shared.hostViewController = self
        if let wv = self.webView {
            HifzNativeEngine.shared.webView = wv
            wv.configuration.allowsInlineMediaPlayback = true
            wv.configuration.mediaTypesRequiringUserActionForPlayback = []
            wv.configuration.userContentController.removeScriptMessageHandler(forName: "hifzNative")
            wv.configuration.userContentController.add(HifzNativeEngine.shared, name: "hifzNative")
            wv.scrollView.bounces = true
            wv.scrollView.alwaysBounceHorizontal = false
            wv.isOpaque = false
            wv.backgroundColor = UIColor(red: 6.0/255.0, green: 20.0/255.0, blue: 18.0/255.0, alpha: 1.0)
        }
    }

    override public var keyCommands: [UIKeyCommand]? {
        return [
            UIKeyCommand(title: "Bugün Planım", action: #selector(handleKeyTab1), input: "1", modifierFlags: .command),
            UIKeyCommand(title: "Ezber Atölyesi", action: #selector(handleKeyTab2), input: "2", modifierFlags: .command),
            UIKeyCommand(title: "Tecvit & Mahreç", action: #selector(handleKeyTab3), input: "3", modifierFlags: .command),
            UIKeyCommand(title: "Ezber Karnem", action: #selector(handleKeyTab4), input: "4", modifierFlags: .command)
        ]
    }

    @objc private func handleKeyTab1() {
        HifzNativeEngine.shared.sendEventToWeb(name: "hifz:key-command", payload: ["tab": "home"])
    }

    @objc private func handleKeyTab2() {
        HifzNativeEngine.shared.sendEventToWeb(name: "hifz:key-command", payload: ["tab": "calis"])
    }

    @objc private func handleKeyTab3() {
        HifzNativeEngine.shared.sendEventToWeb(name: "hifz:key-command", payload: ["tab": "tecvit"])
    }

    @objc private func handleKeyTab4() {
        HifzNativeEngine.shared.sendEventToWeb(name: "hifz:key-command", payload: ["tab": "karne"])
    }
}

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        let rootVC = HifzRootBridgeViewController()
        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = rootVC
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)

        if let shortcutItem = connectionOptions.shortcutItem {
            handleShortcut(shortcutItem)
        }
        if let userActivity = connectionOptions.userActivities.first {
            handleUserActivity(userActivity)
        }
    }

    func windowScene(_ windowScene: UIWindowScene,
                     performActionFor shortcutItem: UIApplicationShortcutItem,
                     completionHandler: @escaping (Bool) -> Void) {
        handleShortcut(shortcutItem)
        completionHandler(true)
    }

    private func handleShortcut(_ item: UIApplicationShortcutItem) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
            HifzNativeEngine.shared.sendEventToWeb(name: "hifz:quick-action", payload: ["type": item.type])
        }
    }

    private func handleUserActivity(_ userActivity: NSUserActivity) {
        if userActivity.activityType == CSSearchableItemActionType,
           let identifier = userActivity.userInfo?[CSSearchableItemActivityIdentifier] as? String,
           let href = HifzSpotlightIndexer.shared.resolveHref(forIdentifier: identifier) {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
                HifzNativeEngine.shared.sendEventToWeb(name: "hifz:spotlight-open", payload: ["href": href])
            }
        }
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        handleUserActivity(userActivity)
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
