import UIKit
import Capacitor
import WebKit
import UserNotifications
import AVFoundation
import MediaPlayer

// MARK: - Native Tajweed & Prosody Engine (Compiled into Mach-O Binary)
final class HifzTajweedProsodyEngine {
    static let shared = HifzTajweedProsodyEngine()

    struct TajweedHighlight: Codable {
        let rule: String
        let labelTr: String
        let colorHex: String
        let count: Int
    }

    private let qalqalahLetters: Set<Character> = ["ق", "ط", "ب", "ج", "د"]
    private let ghunnahClusters: [String] = ["نّ", "مّ", "ً", "ٍ", "ٌ"]
    private let maddMarkers: [String] = ["آ", "ٰ", "ٓ", "ـ"]

    func analyzeArabicSegment(_ text: String) -> [TajweedHighlight] {
        var qalqalahCount = 0
        var ghunnahCount = 0
        var maddCount = 0

        for ch in text {
            if qalqalahLetters.contains(ch) {
                qalqalahCount += 1
            }
        }
        for cluster in ghunnahClusters {
            if text.contains(cluster) {
                ghunnahCount += 1
            }
        }
        for marker in maddMarkers {
            if text.contains(marker) {
                maddCount += 1
            }
        }

        var results: [TajweedHighlight] = []
        if maddCount > 0 {
            results.append(TajweedHighlight(rule: "madd", labelTr: "Med (Uzatma)", colorHex: "#38bdf8", count: maddCount))
        }
        if ghunnahCount > 0 {
            results.append(TajweedHighlight(rule: "ghunnah", labelTr: "Gunne / Tenvin", colorHex: "#34d399", count: ghunnahCount))
        }
        if qalqalahCount > 0 {
            results.append(TajweedHighlight(rule: "qalqalah", labelTr: "Kalkale Harfi", colorHex: "#fbbf24", count: qalqalahCount))
        }
        return results
    }
}

// MARK: - Native Spaced Repetition (SM-2 Variant) Kernel
final class HifzSpacedRepetitionKernel {
    static let shared = HifzSpacedRepetitionKernel()

    struct ReviewScheduleResult: Codable {
        let nextDueTimestampMs: Double
        let intervalHours: Double
        let masteryScore: Int
    }

    func computeSchedule(rating: String, currentStreak: Int, nowMs: Double) -> ReviewScheduleResult {
        let clampedStreak = max(0, min(currentStreak, 12))
        let hours: Double
        let mastery: Int

        switch rating {
        case "again":
            hours = 0.25 // 15 minutes
            mastery = max(10, clampedStreak * 10)
        case "learning":
            hours = Double(max(6, clampedStreak * 12))
            mastery = min(75, 35 + clampedStreak * 12)
        case "solid":
            let multiplier = pow(2.0, Double(max(0, clampedStreak - 1)))
            hours = min(24.0 * 30.0, 24.0 * multiplier)
            mastery = min(100, 70 + clampedStreak * 10)
        default:
            hours = 12.0
            mastery = 50
        }

        let nextDue = nowMs + (hours * 3600.0 * 1000.0)
        return ReviewScheduleResult(nextDueTimestampMs: nextDue, intervalHours: hours, masteryScore: mastery)
    }
}

// MARK: - Native iOS Bridge (Haptics, Local Notifications, Now Playing, Quick Actions, Share Sheet)
final class HifzNativeEngine: NSObject, WKScriptMessageHandler, UNUserNotificationCenterDelegate {
    static let shared = HifzNativeEngine()
    weak var webView: WKWebView?
    weak var hostViewController: UIViewController?

    private let lightImpact = UIImpactFeedbackGenerator(style: .light)
    private let mediumImpact = UIImpactFeedbackGenerator(style: .medium)
    private let heavyImpact = UIImpactFeedbackGenerator(style: .heavy)
    private let selectionFeedback = UISelectionFeedbackGenerator()
    private let notificationFeedback = UINotificationFeedbackGenerator()

    override init() {
        super.init()
        UNUserNotificationCenter.current().delegate = self
    }

    func configureAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .spokenAudio, options: [.allowAirPlay, .allowBluetoothA2DP])
        } catch {
            // Non-fatal if audio session is busy
        }
    }

    func installDefaultQuickActions() {
        let dailyItem = UIApplicationShortcutItem(
            type: "com.tahafirat.hifz.daily",
            localizedTitle: "Günlük Ezber Planı",
            localizedSubtitle: "5 dk aralıklı tekrar oturumu",
            icon: UIApplicationShortcutIcon(systemImageName: "calendar.badge.clock"),
            userInfo: nil
        )
        let coachItem = UIApplicationShortcutItem(
            type: "com.tahafirat.hifz.coach",
            localizedTitle: "Hafız Koçu (3+3 & Rabt)",
            localizedSubtitle: "Yüzünden, ezbere ve birleştirme",
            icon: UIApplicationShortcutIcon(systemImageName: "repeat.circle"),
            userInfo: nil
        )
        let quizItem = UIApplicationShortcutItem(
            type: "com.tahafirat.hifz.challenge",
            localizedTitle: "Sağlamlık Sınaması",
            localizedSubtitle: "İpuçsuz ezber kontrolü",
            icon: UIApplicationShortcutIcon(systemImageName: "checkmark.seal"),
            userInfo: nil
        )
        UIApplication.shared.shortcutItems = [dailyItem, coachItem, quizItem]
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any],
              let action = body["action"] as? String else { return }

        switch action {
        case "haptic":
            let style = (body["style"] as? String) ?? "light"
            triggerHaptic(style: style)

        case "scheduleReminder":
            let hour = (body["hour"] as? Int) ?? 20
            let minute = (body["minute"] as? Int) ?? 30
            let dueCount = (body["dueCount"] as? Int) ?? 3
            scheduleDailyReminder(hour: hour, minute: minute, dueCount: dueCount)

        case "cancelReminder":
            UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ["hifz.daily.reminder"])
            sendEventToWeb(name: "hifz:reminder-status", payload: ["enabled": false])

        case "updateNowPlaying":
            let title = (body["title"] as? String) ?? "Hıfz Tilavet"
            let verse = (body["verse"] as? Int) ?? 1
            updateNowPlayingInfo(title: title, verse: verse)

        case "shareText":
            let text = (body["text"] as? String) ?? "Hıfz — Sure & Dua Ezber Atölyesi"
            presentNativeShare(text: text)

        case "analyzeTajweed":
            let arabic = (body["arabic"] as? String) ?? ""
            let highlights = HifzTajweedProsodyEngine.shared.analyzeArabicSegment(arabic)
            if let data = try? JSONEncoder().encode(highlights),
               let jsonString = String(data: data, encoding: .utf8) {
                sendEventToWeb(name: "hifz:tajweed-result", payload: ["json": jsonString])
            }

        default:
            break
        }
    }

    func triggerHaptic(style: String) {
        DispatchQueue.main.async {
            switch style {
            case "selection":
                self.selectionFeedback.selectionChanged()
            case "medium":
                self.mediumImpact.impactOccurred()
            case "heavy":
                self.heavyImpact.impactOccurred()
            case "success":
                self.notificationFeedback.notificationOccurred(.success)
            case "warning":
                self.notificationFeedback.notificationOccurred(.warning)
            case "error":
                self.notificationFeedback.notificationOccurred(.error)
            default:
                self.lightImpact.impactOccurred()
            }
        }
    }

    private func scheduleDailyReminder(hour: Int, minute: Int, dueCount: Int) {
        let center = UNUserNotificationCenter.current()
        center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
            guard granted else {
                self.sendEventToWeb(name: "hifz:reminder-status", payload: ["enabled": false, "denied": true])
                return
            }
            center.removePendingNotificationRequests(withIdentifiers: ["hifz.daily.reminder"])

            let content = UNMutableNotificationContent()
            content.title = "Hıfz · Günlük Ezber Vakti"
            content.body = dueCount > 0
                ? "Bugün tekrar bekleyen \(dueCount) ayet/durak var. 5 dakikalık 3+3 Rabt çalışmasıyla ezberini sağlamlaştır."
                : "Günlük 5 dakikalık sure ve dua ezber tekrarın için atölyen hazır."
            content.sound = .default

            var dateComponents = DateComponents()
            dateComponents.hour = max(0, min(23, hour))
            dateComponents.minute = max(0, min(59, minute))

            let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
            let request = UNNotificationRequest(identifier: "hifz.daily.reminder", content: content, trigger: trigger)
            center.add(request) { err in
                self.triggerHaptic(style: err == nil ? "success" : "error")
                self.sendEventToWeb(name: "hifz:reminder-status", payload: [
                    "enabled": err == nil,
                    "hour": hour,
                    "minute": minute
                ])
            }
        }
    }

    private func updateNowPlayingInfo(title: String, verse: Int) {
        configureAudioSession()
        var info = [String: Any]()
        info[MPMediaItemPropertyTitle] = "\(title) · \(verse). Ayet"
        info[MPMediaItemPropertyArtist] = "Mişârî Râşid el-Afâsî"
        info[MPMediaItemPropertyAlbumTitle] = "Hıfz Ezber Atölyesi"
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }

    private func presentNativeShare(text: String) {
        DispatchQueue.main.async {
            guard let vc = self.hostViewController else { return }
            let activityVC = UIActivityViewController(activityItems: [text], applicationActivities: nil)
            if let popover = activityVC.popoverPresentationController {
                popover.sourceView = vc.view
                popover.sourceRect = CGRect(x: vc.view.bounds.midX, y: vc.view.bounds.midY, width: 0, height: 0)
                popover.permittedArrowDirections = []
            }
            vc.present(activityVC, animated: true)
        }
    }

    func sendEventToWeb(name: String, payload: [String: Any]) {
        guard let data = try? JSONSerialization.data(withJSONObject: payload),
              let json = String(data: data, encoding: .utf8) else { return }
        DispatchQueue.main.async {
            self.webView?.evaluateJavaScript("window.dispatchEvent(new CustomEvent('\(name)', { detail: \(json) }));", completionHandler: nil)
        }
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .sound])
    }
}

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        HifzNativeEngine.shared.configureAudioSession()
        HifzNativeEngine.shared.installDefaultQuickActions()
        return true
    }

    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Default Configuration",
                                          sessionRole: connectingSceneSession.role)
        config.delegateClass = SceneDelegate.self
        return config
    }
}
