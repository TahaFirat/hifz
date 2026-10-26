import UIKit
import Capacitor
import WebKit

final class HifzRootBridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        HifzNativeEngine.shared.hostViewController = self
        if let wv = self.webView {
            HifzNativeEngine.shared.webView = wv
            wv.configuration.userContentController.removeScriptMessageHandler(forName: "hifzNative")
            wv.configuration.userContentController.add(HifzNativeEngine.shared, name: "hifzNative")
            wv.scrollView.bounces = true
            wv.scrollView.alwaysBounceHorizontal = false
            wv.isOpaque = false
            wv.backgroundColor = UIColor(red: 6.0/255.0, green: 20.0/255.0, blue: 18.0/255.0, alpha: 1.0)
        }
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

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
