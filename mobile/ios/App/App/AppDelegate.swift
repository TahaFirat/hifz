import UIKit
import Capacitor
import WebKit
import UserNotifications
import AVFoundation
import MediaPlayer
import CoreSpotlight

// MARK: - Native Spotlight Search Indexer (CoreSpotlight)
final class HifzSpotlightIndexer {
    static let shared = HifzSpotlightIndexer()
    private let domainIdentifier = "com.tahafirat.hifz.catalog"

    struct CatalogEntry {
        let id: String
        let title: String
        let description: String
        let keywords: [String]
        let href: String
    }

    private let entries: [CatalogEntry] = [
        CatalogEntry(id: "hifz://calis?kategori=basics&icerik=s1", title: "Fâtiha Suresi · Ezber & 3+3 Rabt", description: "7 ayet · Namazın temel suresi, duraklı ezber ve tecvit analizi", keywords: ["fatiha", "elham", "namaz suresi", "ezber", "hıfz"], href: "/calis?kategori=basics&icerik=s1"),
        CatalogEntry(id: "hifz://calis?kategori=basics&icerik=k255", title: "Âyetel Kürsî (Bakara 255) · 9 Duraklı Ezber", description: "Manalı nefes durakları, Osmanlı 3+3 Rabt koçu ve kademeli gizleme", keywords: ["ayetel kürsi", "bakara 255", "ezber", "durak"], href: "/calis?kategori=basics&icerik=k255"),
        CatalogEntry(id: "hifz://calis?kategori=basics&icerik=k285", title: "Âmenerrasûlü (Bakara 285-286) · Ezber Atölyesi", description: "Yatsı namazı sonrası okunan aşır, duraklı ve sondan başa zincirleme ezber", keywords: ["amenerrasulü", "bakara son iki ayet", "aşır", "ezber"], href: "/calis?kategori=basics&icerik=k285"),
        CatalogEntry(id: "hifz://calis?kategori=basics&icerik=k5922", title: "Hüvallâhüllezî (Haşr 22-24) · Esmâül Hüsnâ Aşırı", description: "Sabah ve akşam namazı sonrası okunan Haşr suresi son 3 ayet ezberi", keywords: ["hüvallahüllezi", "haşr", "lev enzelna", "ezber"], href: "/calis?kategori=basics&icerik=k5922"),
        CatalogEntry(id: "hifz://calis?kategori=basics&icerik=s112", title: "İhlâs Suresi · Kalkale & Ezber", description: "Kul hüvallâhü ehad · Tecvit ve 3+3 hafızlık çalışması", keywords: ["ihlas", "kul hüvallahü", "namaz suresi"], href: "/calis?kategori=basics&icerik=s112"),
        CatalogEntry(id: "hifz://calis?kategori=basics&icerik=s113", title: "Felak Suresi · Muavvizeteyn Ezber", description: "Kul eûzü birabbil felak · Kelime gizleme ve sesli öz-kontrol", keywords: ["felak", "muavvizeteyn", "sure ezber"], href: "/calis?kategori=basics&icerik=s113"),
        CatalogEntry(id: "hifz://calis?kategori=basics&icerik=s114", title: "Nâs Suresi · Gunne & Ezber", description: "Kul eûzü birabbin nâs · Namaz suresi ezber atölyesi", keywords: ["nas", "kul euzü", "namaz suresi"], href: "/calis?kategori=basics&icerik=s114"),
        CatalogEntry(id: "hifz://calis?kategori=basics&icerik=s108", title: "Kevser Suresi · Kısa Namaz Suresi", description: "İnnâ a'taynâkel kevser · Med ve gunne tecvitli ezber", keywords: ["kevser", "inna atayna", "namaz suresi"], href: "/calis?kategori=basics&icerik=s108"),
        CatalogEntry(id: "hifz://calis?kategori=basics&icerik=s103", title: "Asr Suresi · Kısa Sure Ezberi", description: "Vel asr · Hızlı 3+3 tekrar ve sağlamlık sınaması", keywords: ["asr", "vel asr", "sure ezber"], href: "/calis?kategori=basics&icerik=s103"),
        CatalogEntry(id: "hifz://calis?kategori=prayers&icerik=subhaneke", title: "Sübhâneke Duası · Duraklı Namaz Duası", description: "Namaz başlangıç duası · Türkçe okunuş, anlam çapası ve ezber", keywords: ["sübhaneke", "namaz duası", "dua ezber"], href: "/calis?kategori=prayers&icerik=subhaneke"),
        CatalogEntry(id: "hifz://calis?kategori=prayers&icerik=ettehiyyatu", title: "Ettehiyyâtü Duası · Oturuş (Ka'de) Duası", description: "Namaz oturuşlarında okunan Tahiyyat duası duraklı ezberi", keywords: ["ettehiyyatü", "tahiyyat", "namaz duası"], href: "/calis?kategori=prayers&icerik=ettehiyyatu"),
        CatalogEntry(id: "hifz://calis?kategori=prayers&icerik=salli", title: "Allâhümme Salli & Bârik Duaları", description: "Salavat duaları · Kademeli gizleme ve sesli tekrar", keywords: ["allahümme salli", "allahümme barik", "salavat"], href: "/calis?kategori=prayers&icerik=salli"),
        CatalogEntry(id: "hifz://calis?kategori=prayers&icerik=kunut1", title: "Kunut Duaları (1 & 2) · Vitir Namazı", description: "Allâhümme innâ nesteînüke & Allâhümme iyyâke na'büdü duraklı ezber", keywords: ["kunut", "vitir", "namaz duası", "ezber"], href: "/calis?kategori=prayers&icerik=kunut1"),
        CatalogEntry(id: "hifz://calis?kategori=all&icerik=all36", title: "Yâsîn Suresi · 5'er Ayetlik Hafızlık Planı", description: "83 ayet · Bölümlere ayrılmış 3+3 Rabt ve aralıklı tekrar", keywords: ["yasin", "yasini şerif", "hafızlık"], href: "/calis?kategori=all&icerik=all36"),
        CatalogEntry(id: "hifz://calis?kategori=all&icerik=all67", title: "Mülk (Tebâreke) Suresi · Hafızlık Atölyesi", description: "30 ayet · Sondan başa zincirleme ve köprü testi ile ezber", keywords: ["mülk", "tebareke", "sure ezber"], href: "/calis?kategori=all&icerik=all67"),
        CatalogEntry(id: "hifz://calis?kategori=all&icerik=all78", title: "Nebe (Amme) Suresi · 30. Cüz Ezber", description: "40 ayet · 30. cüz başlangıç suresi duraklı ezber çalışması", keywords: ["nebe", "amme", "30 cüz", "hafızlık"], href: "/calis?kategori=all&icerik=all78")
    ]

    func indexCatalog() {
        var searchableItems: [CSSearchableItem] = []
        for entry in entries {
            let attr = CSSearchableItemAttributeSet(itemContentType: "public.text")
            attr.title = entry.title
            attr.contentDescription = entry.description
            attr.keywords = entry.keywords
            let item = CSSearchableItem(uniqueIdentifier: entry.id, domainIdentifier: domainIdentifier, attributeSet: attr)
            item.expirationDate = Date.distantFuture
            searchableItems.append(item)
        }
        CSSearchableIndex.default().indexSearchableItems(searchableItems, completionHandler: nil)
    }

    func resolveHref(forIdentifier identifier: String) -> String? {
        if let match = entries.first(where: { $0.id == identifier }) {
            return match.href
        }
        if identifier.hasPrefix("hifz://") {
            return "/" + String(identifier.dropFirst("hifz://".count))
        }
        return nil
    }
}

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
            try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetooth, .allowBluetoothA2DP, .allowAirPlay])
            try session.setActive(true, options: .notifyOthersOnDeactivation)
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

        case "computeSchedule":
            let rating = (body["rating"] as? String) ?? "learning"
            let streak = (body["streak"] as? Int) ?? 1
            let nowMs = (body["nowMs"] as? Double) ?? (Date().timeIntervalSince1970 * 1000.0)
            let schedule = HifzSpacedRepetitionKernel.shared.computeSchedule(rating: rating, currentStreak: streak, nowMs: nowMs)
            sendEventToWeb(name: "hifz:schedule-result", payload: [
                "nextDueTimestampMs": schedule.nextDueTimestampMs,
                "intervalHours": schedule.intervalHours,
                "masteryScore": schedule.masteryScore
            ])

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
        HifzSpotlightIndexer.shared.indexCatalog()
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
