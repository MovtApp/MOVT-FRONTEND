//
//  NotificationService.swift — MOVT
//
//  Faz a FOTO aparecer na notificação do iOS (avatar de quem interagiu, ou a
//  imagem do post). O iOS ignora URL de imagem no payload: só uma Notification
//  Service Extension pode baixar o arquivo e anexá-lo antes de a notificação
//  ser exibida. É o que Instagram/WhatsApp fazem.
//
//  Disparada apenas quando o payload traz `mutable-content: 1` — o backend já
//  manda `mutableContent: true` sempre que há imagem (services/pushService.js).
//
//  POR QUE A BUSCA DA URL É "DEFENSIVA":
//  O servidor do Expo Push traduz o nosso `richContent.image` para o payload do
//  APNs, mas essa tradução NÃO é documentada e não existe no SDK — no Android o
//  Expo usa o campo nativo do FCM (`remoteMessage.notification.imageUrl`), e no
//  APNs não há campo padrão equivalente. Em vez de fixar uma chave no chute,
//  procuramos a URL nas formas plausíveis e, por segurança, varremos o payload.
//  Se nada for encontrado, a notificação é entregue SEM imagem — nunca some.
//

import UserNotifications
import UniformTypeIdentifiers

class NotificationService: UNNotificationServiceExtension {
  private var contentHandler: ((UNNotificationContent) -> Void)?
  private var bestAttempt: UNMutableNotificationContent?
  private var downloadTask: URLSessionDownloadTask?

  override func didReceive(
    _ request: UNNotificationRequest,
    withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
  ) {
    self.contentHandler = contentHandler
    self.bestAttempt = request.content.mutableCopy() as? UNMutableNotificationContent

    guard let content = bestAttempt else {
      contentHandler(request.content)
      return
    }

    guard
      let urlString = Self.findImageURL(in: request.content.userInfo),
      let url = URL(string: urlString)
    else {
      // Sem imagem: entrega o conteúdo original, intacto.
      contentHandler(content)
      return
    }

    downloadTask = URLSession.shared.downloadTask(with: url) { [weak self] tempURL, response, _ in
      // `defer` garante que a notificação SEMPRE é entregue, com ou sem foto.
      defer { self?.deliver() }
      guard let tempURL = tempURL else { return }
      if let attachment = Self.makeAttachment(from: tempURL, response: response, sourceURL: url) {
        self?.bestAttempt?.attachments = [attachment]
      }
    }
    downloadTask?.resume()
  }

  /// O iOS dá ~30s. No estouro, entrega o que tiver (texto, sem foto).
  override func serviceExtensionTimeWillExpire() {
    downloadTask?.cancel()
    deliver()
  }

  private func deliver() {
    guard let handler = contentHandler, let content = bestAttempt else { return }
    // Zera para não chamar o handler duas vezes (download + timeout).
    contentHandler = nil
    handler(content)
  }

  // MARK: - Anexo

  /// `UNNotificationAttachment` exige um arquivo com extensão reconhecível: o
  /// download vem sem ela, então copiamos para um nome com a extensão correta.
  private static func makeAttachment(
    from tempURL: URL,
    response: URLResponse?,
    sourceURL: URL
  ) -> UNNotificationAttachment? {
    let ext = fileExtension(response: response, sourceURL: sourceURL)
    let dest = URL(fileURLWithPath: NSTemporaryDirectory())
      .appendingPathComponent(UUID().uuidString)
      .appendingPathExtension(ext)
    do {
      try FileManager.default.moveItem(at: tempURL, to: dest)
      return try UNNotificationAttachment(identifier: "movt-image", url: dest, options: nil)
    } catch {
      return nil
    }
  }

  /// Extensão pelo MIME (fonte confiável); cai para a da URL; por fim "jpg".
  private static func fileExtension(response: URLResponse?, sourceURL: URL) -> String {
    if let mime = response?.mimeType,
       let type = UTType(mimeType: mime),
       let ext = type.preferredFilenameExtension {
      return ext
    }
    let urlExt = sourceURL.pathExtension.lowercased()
    let supported = ["jpg", "jpeg", "png", "gif"]
    return supported.contains(urlExt) ? urlExt : "jpg"
  }

  // MARK: - Localizar a URL da imagem no payload

  /// Caminhos conhecidos/plausíveis, na ordem. O Expo aninha os dados do push
  /// sob "body", daí as duas variantes.
  private static func findImageURL(in userInfo: [AnyHashable: Any]) -> String? {
    let candidates: [[String]] = [
      ["richContent", "image"],
      ["body", "richContent", "image"],
      ["data", "richContent", "image"],
      ["image"],
      ["body", "image"],
      ["data", "image"],
    ]
    for path in candidates {
      if let value = string(at: path, in: userInfo) { return value }
    }
    // Rede de segurança: varre o payload atrás de uma chave "image" com URL.
    return deepSearchImage(in: userInfo, depth: 0)
  }

  private static func string(at path: [String], in root: [AnyHashable: Any]) -> String? {
    var current: Any? = root
    for key in path {
      guard let dict = current as? [AnyHashable: Any] else { return nil }
      current = dict[key]
    }
    guard let value = current as? String, isHTTP(value) else { return nil }
    return value
  }

  /// Busca limitada em profundidade — o payload do APNs é raso; o limite evita
  /// gastar o tempo da extensão em estrutura inesperada.
  private static func deepSearchImage(in dict: [AnyHashable: Any], depth: Int) -> String? {
    if depth > 3 { return nil }
    for (key, value) in dict {
      if let keyName = key as? String,
         keyName.lowercased().contains("image"),
         let str = value as? String,
         isHTTP(str) {
        return str
      }
      if let nested = value as? [AnyHashable: Any],
         let found = deepSearchImage(in: nested, depth: depth + 1) {
        return found
      }
    }
    return nil
  }

  private static func isHTTP(_ value: String) -> Bool {
    return value.hasPrefix("http://") || value.hasPrefix("https://")
  }
}
